import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import { useWindowDimensions } from 'react-native';
import { useDeferredValue } from '@/hooks/useDeferredValue';

interface OptimizedPDFViewerProps {
  uri: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function OptimizedPDFViewer({
  uri,
  initialPage = 1,
  onPageChange,
  onLoad,
  onError,
}: OptimizedPDFViewerProps) {
  const { width, height } = useWindowDimensions();
  const pdfRef = useRef<Pdf>(null);
  const webViewRef = useRef<WebView>(null);
  const [totalPages, setTotalPages] = useState(0);
  
  // Используем отложенное значение для предотвращения частых обновлений
  const deferredPage = useDeferredValue(initialPage);

  const handlePageChange = useCallback((page: number) => {
    onPageChange?.(page);
  }, [onPageChange]);

  if (Platform.OS === 'web') {
    // Используем PDF.js для веб-версии
    const pdfViewerHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          <style>
            body { margin: 0; }
            #viewer { width: 100vw; height: 100vh; }
            .page { margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div id="viewer"></div>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            
            let currentPage = ${deferredPage};
            let pdfDoc = null;
            let pageRendering = false;
            let renderPending = false;
            
            async function loadPDF() {
              try {
                pdfDoc = await pdfjsLib.getDocument('${uri}').promise;
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'loaded',
                  totalPages: pdfDoc.numPages,
                }));
                renderPage(currentPage);
              } catch (error) {
                console.error('Error loading PDF:', error);
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'error',
                  error: error.message,
                }));
              }
            }

            async function renderPage(num) {
              if (pageRendering) {
                renderPending = true;
                return;
              }
              
              pageRendering = true;
              
              try {
                const page = await pdfDoc.getPage(num);
                const viewport = page.getViewport({ scale: window.devicePixelRatio });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                
                const renderContext = {
                  canvasContext: ctx,
                  viewport: viewport,
                };
                
                await page.render(renderContext).promise;
                
                const viewer = document.getElementById('viewer');
                viewer.innerHTML = '';
                viewer.appendChild(canvas);
                
                pageRendering = false;
                
                if (renderPending) {
                  renderPending = false;
                  renderPage(currentPage);
                }
                
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'pageChanged',
                  page: num,
                }));
              } catch (error) {
                console.error('Error rendering page:', error);
                pageRendering = false;
              }
            }

            document.addEventListener('keydown', (e) => {
              if (e.key === 'ArrowRight' && currentPage < pdfDoc?.numPages) {
                currentPage++;
                renderPage(currentPage);
              } else if (e.key === 'ArrowLeft' && currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
              }
            });

            loadPDF();
          </script>
        </body>
      </html>
    `;

    return (
      <WebView
        ref={webViewRef}
        source={{ html: pdfViewerHtml }}
        style={styles.container}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            switch (data.type) {
              case 'loaded':
                setTotalPages(data.totalPages);
                onLoad?.();
                break;
              case 'pageChanged':
                handlePageChange(data.page);
                break;
              case 'error':
                onError?.(new Error(data.error));
                break;
            }
          } catch (error) {
            console.error('Error handling message:', error);
          }
        }}
      />
    );
  }

  // Используем react-native-pdf для нативных платформ
  return (
    <View style={styles.container}>
      <Pdf
        ref={pdfRef}
        source={{ uri }}
        style={[styles.container, { width }]}
        page={deferredPage}
        enablePaging
        horizontal
        onPageChanged={handlePageChange}
        onLoadComplete={(numberOfPages) => {
          setTotalPages(numberOfPages);
          onLoad?.();
        }}
        onError={(error) => {
          console.error('PDF error:', error);
          onError?.(error);
        }}
        // Оптимизации производительности
        enableRTL={false}
        enableAnnotationRendering={false}
        enablePaging
        spacing={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
