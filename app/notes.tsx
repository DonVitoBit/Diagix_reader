import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { getCurrentUser } from '@/lib/supabase';
import {
  Bookmark,
  Highlight,
  getBookmarks,
  getHighlights,
  deleteBookmark,
  deleteHighlight,
  exportToMarkdown,
  HighlightColor,
  categoryIcons,
  categoryLabels,
} from '@/lib/annotations';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FadeInView, SlideInView } from '@/components/Animated';
import { theme, typography, spacing, radius } from '@/styles/theme';

export default function NotesScreen() {
  const { bookId, title } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [colorFilter, setColorFilter] = useState<HighlightColor | 'all'>('all');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId && bookId) {
      loadAnnotations();
    }
  }, [userId, bookId]);

  async function loadUser() {
    const user = await getCurrentUser();
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо войти в аккаунт');
      router.replace('/profile');
      return;
    }
    setUserId(user.id);
  }

  async function loadAnnotations() {
    if (!userId || !bookId) return;
    const [bookmarksData, highlightsData] = await Promise.all([
      getBookmarks(userId, bookId as string),
      getHighlights(userId, bookId as string),
    ]);
    setBookmarks(bookmarksData);
    setHighlights(highlightsData);
  }

  async function handleDeleteBookmark(id: string) {
    const success = await deleteBookmark(id);
    if (success) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    }
  }

  async function handleDeleteHighlight(id: string) {
    const success = await deleteHighlight(id);
    if (success) {
      setHighlights(prev => prev.filter(h => h.id !== id));
    }
  }

  function handleExport() {
    const markdown = exportToMarkdown(
      title as string,
      bookmarks,
      highlights.filter(h => colorFilter === 'all' || h.color === colorFilter)
    );

    if (Platform.OS === 'web') {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-notes.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Экспорт', 'Функция экспорта доступна только в веб-версии');
    }
  }

  const filteredHighlights = highlights.filter(
    h => colorFilter === 'all' || h.color === colorFilter
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FadeInView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Button
            title="Экспорт"
            onPress={handleExport}
            variant="primary"
            size="small"
          />
        </View>

        <Card style={styles.filterCard}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Фильтр по цвету:
          </Text>
          <Picker
            selectedValue={colorFilter}
            onValueChange={value => setColorFilter(value as HighlightColor | 'all')}
            style={[styles.picker, { color: colors.text }]}
          >
            <Picker.Item label="Все" value="all" />
            <Picker.Item label="Жёлтый" value="yellow" />
            <Picker.Item label="Зелёный" value="green" />
            <Picker.Item label="Синий" value="blue" />
          </Picker>
        </Card>

        <ScrollView style={styles.content}>
          {bookmarks.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Закладки
              </Text>
              {bookmarks.map((bookmark, index) => (
                <SlideInView
                  key={bookmark.id}
                  delay={index * 100}
                  style={styles.annotationWrapper}
                >
                  <Card variant="elevated" style={styles.annotationCard}>
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryText, { color: colors.text }]}>
                        {categoryIcons[bookmark.category]} {categoryLabels[bookmark.category]}
                      </Text>
                      <Button
                        title="Удалить"
                        onPress={() => handleDeleteBookmark(bookmark.id!)}
                        variant="outline"
                        size="small"
                      />
                    </View>
                    {bookmark.note && (
                      <Text style={[styles.note, { color: colors.textSecondary }]}>
                        {bookmark.note}
                      </Text>
                    )}
                  </Card>
                </SlideInView>
              ))}
            </View>
          )}

          {filteredHighlights.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Выделения
              </Text>
              {filteredHighlights.map((highlight, index) => (
                <SlideInView
                  key={highlight.id}
                  delay={index * 100}
                  style={styles.annotationWrapper}
                >
                  <Card
                    variant="elevated"
                    style={[
                      styles.annotationCard,
                      {
                        backgroundColor:
                          highlight.color === 'yellow' ? 'rgba(255, 235, 59, 0.1)' :
                          highlight.color === 'green' ? 'rgba(76, 175, 80, 0.1)' :
                          'rgba(33, 150, 243, 0.1)',
                      },
                    ]}
                  >
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      {highlight.text}
                    </Text>
                    {highlight.note && (
                      <Text style={[styles.note, { color: colors.textSecondary }]}>
                        {highlight.note}
                      </Text>
                    )}
                    <Button
                      title="Удалить"
                      onPress={() => handleDeleteHighlight(highlight.id!)}
                      variant="outline"
                      size="small"
                      style={styles.deleteButton}
                    />
                  </Card>
                </SlideInView>
              ))}
            </View>
          )}

          {bookmarks.length === 0 && highlights.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Нет сохраненных закладок или выделений
            </Text>
          )}
        </ScrollView>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
  },
  filterCard: {
    margin: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterLabel: {
    ...typography.body,
  },
  picker: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  annotationWrapper: {
    marginBottom: spacing.md,
  },
  annotationCard: {
    gap: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    ...typography.body,
  },
  highlightText: {
    ...typography.body,
  },
  note: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  deleteButton: {
    alignSelf: 'flex-end',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});