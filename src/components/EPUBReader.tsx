// ... существующий код ...

// Добавьте в начало файла импорт компонента ReportDialog
import { ReportDialog } from './ReportDialog';

export function EPUBReader({ /* ... существующие пропсы ... */ }) {
  // ... существующий код ...

  // Добавьте состояния для отчетов
  const [selectedText, setSelectedText] = useState<{
    text: string;
    cfi: string;
  } | null>(null);
  const [reportDialogVisible, setReportDialogVisible] = useState(false);

  // Обновите HTML для поддержки контекстного меню
  const readerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <!-- ... существующий код ... -->
        <style>
          /* ... существующие стили ... */
          .report-menu {
            position: absolute;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
          }
          .report-button {
            background: #f5f5f5;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
          .report-button:hover {
            background: #e5e5e5;
          }
        </style>
      </head>
      <body>
        <!-- ... существующий код ... -->
        <script>
          // ... существующий код ...

          // Добавьте обработчик выделения текста
          rendition.on('selected', function(cfiRange, contents) {
            const selection = contents.window.getSelection();
            const text = selection?.toString() || '';
            
            if (!text) return;

            // Создаем меню
            const menu = document.createElement('div');
            menu.className = 'report-menu';
            menu.style.left = '${event.clientX}px';
            menu.style.top = '${event.clientY}px';

            const button = document.createElement('button');
            button.className = 'report-button';
            button.textContent = 'Сообщить о проблеме';
            button.onclick = function() {
              const data = {
                type: 'report',
                text,
                cfi: cfiRange,
              };
              window.ReactNativeWebView ?
                window.ReactNativeWebView.postMessage(JSON.stringify(data)) :
                window.parent.postMessage(JSON.stringify(data), '*');
              menu.remove();
            };

            menu.appendChild(button);
            document.body.appendChild(menu);

            // Удаляем меню при клике вне него
            const removeMenu = function(e) {
              if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
              }
            };
            document.addEventListener('click', removeMenu);
          });
        </script>
      </body>
    </html>
  `;

  // Обновите обработчик сообщений
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent?.data || event.data);
      
      switch (data.type) {
        case 'report':
          setSelectedText({
            text: data.text,
            cfi: data.cfi,
          });
          setReportDialogVisible(true);
          break;
        // ... существующие обработчики ...
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  return (
    <>
      {/* ... существующий код ... */}
      
      <ReportDialog
        visible={reportDialogVisible}
        onClose={() => {
          setReportDialogVisible(false);
          setSelectedText(null);
        }}
        bookId={bookId}
        selectedText={selectedText?.text || ''}
        cfi={selectedText?.cfi || ''}
        onSuccess={() => {
          // Можно добавить уведомление об успешной отправке
          alert('Спасибо за сообщение! Мы рассмотрим его в ближайшее время.');
        }}
      />
    </>
  );
}