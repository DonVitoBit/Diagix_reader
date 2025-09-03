import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Platform, StyleSheet, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import Pdf from 'react-native-pdf';
import { supabase } from '@/lib/supabase';
import { ReaderControls } from '@/components/ReaderControls';
import { useThemeStyles, Theme } from '@/contexts/UISettingsContext';
import { getCurrentUser } from '@/lib/supabase';
import { getProgress, upsertProgress } from '@/lib/progress';

interface Book {
  id: string;
  title: string;
  format: 'epub' | 'pdf';
  file_path: string;
}

interface Location {
  cfi?: string;
  page?: number;
  percentage: number;
}

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const pdfRef = useRef<any>(null);
  const styles = useThemeStyles();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  // Загрузка информации о пользователе
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Ошибка', 'Необходимо войти в аккаунт');
        router.replace('/profile');
        return;
      }
      setUserId(user.id);
    }
    loadUser();
  }, []);

  // Загрузка книги и прогресса чтения
  useEffect(() => {
    if (id && userId) {
      loadBookAndProgress();
    }
  }, [id, userId]);

  async function loadBookAndProgress() {
    try {
      // Загрузка информации о книге
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

      // Получение URL для загрузки файла
      const { data: { signedUrl }, error: urlError } = await supabase
        .storage
        .from('books')
        .createSignedUrl(bookData.file_path, 3600);

      if (urlError) throw urlError;
      setFileUrl(signedUrl);

      // Загрузка прогресса чтения
      if (userId) {
        const progress = await getProgress(userId, id as string);
        if (progress) {
          setCurrentLocation({
            cfi: bookData.format === 'epub' ? progress.loc : undefined,
            page: bookData.format === 'pdf' ? parseInt(progress.loc) : undefined,
            percentage: progress.percent,
          });
        }
      }
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить книгу');
    }
  }

  // Сохранение прогресса чтения
  const saveProgress = useCallback(async (location: Location) => {
    if (!userId || !book) return;

    try {
      await upsertProgress({
        user_id: userId,
        book_id: book.id,
        loc: location.cfi || location.page?.toString() || '',
        percent: location.percentage,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [userId, book]);

  // Обработчик изменения темы
  const handleThemeChange = (theme: Theme) => {
    if (book?.format === 'epub' && webViewRef.current) {
      const themeStyles = {
        light: { body: { background: '#ffffff', color: '#1a1a1a' } },
        dark: { body: { background: '#1a1a1a', color: '#ffffff' } },
        sepia: { body: { background: '#f1e7d0', color: '#433422' } },
      };

      webViewRef.current.injectJavaScript(`
        try {
          window.rendition.themes.register({ theme: ${JSON.stringify(themeStyles[theme])} });
          window.rendition.themes.select('theme');
        } catch (e) {
          console.error('Error applying theme:', e);
        }
        true;
      `);
    }
  };

  if (!book || !fileUrl) {
    return <View style={containerStyles.container} />;
  }

  if (book.format === 'pdf') {
    if (Platform.OS === 'web') {
      const pdfViewerUrl = new URL('/pdfjs/web/viewer.html', window.location.origin);
      pdfViewerUrl.searchParams.set('file', fileUrl);
      if (currentLocation?.page) {
        pdfViewerUrl.searchParams.set('page', currentLocation.page.toString());
      }

      return (
        <View style={[containerStyles.container, { backgroundColor: styles.background }]}>
          <iframe
            src={pdfViewerUrl.toString()}
            style={{ flex: 1, border: 'none' }}
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              iframe.contentWindow?.addEventListener('pagechange', (event: any) => {
                const page = event.detail?.pageNumber;
                if (page) {
                  const percentage = (page / event.detail?.pagesCount) * 100;
                  const location = { page, percentage };
                  setCurrentLocation(location);
                  saveProgress(location);
                }
              });
            }}
          />
          <ReaderControls />
        </View>
      );
    }

    return (
      <View style={[containerStyles.container, { backgroundColor: styles.background }]}>
        <Pdf
          ref={pdfRef}
          source={{ uri: fileUrl }}
          style={containerStyles.pdf}
          enablePaging
          horizontal
          page={currentLocation?.page}
          onPageChanged={(page) => {
            pdfRef.current?.getNumberOfPages().then((total: number) => {
              const location = {
                page,
                percentage: (page / total) * 100,
              };
              setCurrentLocation(location);
              saveProgress(location);
            });
          }}
        />
        <ReaderControls />
      </View>
    );
  }

  if (book.format === 'epub') {
    const readerHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/epubjs/0.3.93/epub.min.js"></script>
          <style>
            body { margin: 0; }
            #viewer { height: 100vh; }
            * { font-size: ${styles.fontSize}px !important; line-height: ${styles.lineHeight} !important; }
          </style>
        </head>
        <body style="background-color: ${styles.background}; color: ${styles.text};">
          <div id="viewer"></div>
          <script>
            var book = ePub("${fileUrl}");
            window.rendition = book.renderTo("viewer", {
              width: "100%",
              height: "100%",
              spread: "none"
            });

            ${currentLocation?.cfi ? 
              `rendition.display("${currentLocation.cfi}");` : 
              'rendition.display();'
            }

            rendition.on('relocated', function(location) {
              const data = {
                type: 'relocated',
                cfi: location.start.cfi,
                percentage: (location.start.percentage * 100)
              };
              window.ReactNativeWebView ? 
                window.ReactNativeWebView.postMessage(JSON.stringify(data)) :
                window.parent.postMessage(JSON.stringify(data), '*');
            });

            rendition.themes.register({ theme: ${JSON.stringify({
              body: {
                background: styles.background,
                color: styles.text,
                fontSize: `${styles.fontSize}px`,
                lineHeight: styles.lineHeight,
              }
            })} });
            rendition.themes.select('theme');
          </script>
        </body>
      </html>
    `;

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent?.data || event.data);
        if (data.type === 'relocated') {
          const location = {
            cfi: data.cfi,
            percentage: data.percentage,
          };
          setCurrentLocation(location);
          saveProgress(location);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    if (Platform.OS === 'web') {
      return (
        <View style={containerStyles.container}>
          <iframe
            srcDoc={readerHtml}
            style={{ flex: 1, border: 'none' }}
            onMessage={handleMessage}
          />
          <ReaderControls onThemeChange={handleThemeChange} />
        </View>
      );
    }

    return (
      <View style={containerStyles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: readerHtml }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
        />
        <ReaderControls onThemeChange={handleThemeChange} />
      </View>
    );
  }

  return <View style={containerStyles.container} />;
}

const containerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
});