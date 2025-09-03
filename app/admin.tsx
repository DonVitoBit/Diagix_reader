// ... существующий код ...

type AdminTab = 'dashboard' | 'books' | 'users' | 'analytics' | 'bulk' | 'moderation' | 'import' | 'reports';

export default function AdminScreen() {
  // ... существующий код ...

  const tabs: { id: AdminTab; title: string; icon: string }[] = [
    { id: 'dashboard', title: 'Обзор', icon: '📊' },
    { id: 'analytics', title: 'Аналитика', icon: '📈' },
    { id: 'books', title: 'Добавить книгу', icon: '📚' },
    { id: 'reports', title: 'Отчеты', icon: '🔍' },
    { id: 'moderation', title: 'Модерация', icon: '👁️' },
    { id: 'users', title: 'Пользователи', icon: '👥' },
    { id: 'bulk', title: 'Операции', icon: '⚙️' },
    { id: 'import', title: 'Импорт/Экспорт', icon: '📥' },
  ];

  return (
    <PageTransition>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* ... существующий код ... */}
        
        <View style={styles.content}>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'books' && <AdminBookForm />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'bulk' && <BulkOperations />}
          {activeTab === 'moderation' && <Moderation />}
          {activeTab === 'import' && <ImportExport />}
          {activeTab === 'reports' && <ReportsManagement />}
        </View>
      </View>
    </PageTransition>
  );
}