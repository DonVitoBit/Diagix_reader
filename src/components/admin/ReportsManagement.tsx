import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { theme, typography, spacing, BRAND_COLOR } from '@/styles/theme';

type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

interface Report {
  id: string;
  user_id: string;
  book_id: string;
  cfi: string;
  selected_text: string;
  type: string;
  description: string;
  suggestion?: string;
  status: ReportStatus;
  created_at: string;
  admin_note?: string;
  resolution?: string;
  user: {
    email: string;
  };
  book: {
    title: string;
    author: string;
  };
}

export function ReportsManagement() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const queryClient = useQueryClient();
  
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Получаем отчеты
  const { data: reports } = useQuery({
    queryKey: ['reports', selectedStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          user:profiles(email),
          book:books(title, author)
        `)
        .eq('status', selectedStatus)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
  });

  // Мутация для обновления статуса
  const updateReport = useMutation({
    mutationFn: async ({
      id,
      status,
      resolution,
      adminNote,
    }: {
      id: string;
      status: ReportStatus;
      resolution?: string;
      adminNote?: string;
    }) => {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          resolution,
          admin_note: adminNote,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedReport(null);
      setResolution('');
      setAdminNote('');
    },
  });

  const handleUpdateStatus = (status: ReportStatus) => {
    if (!selectedReport) return;

    if (status === 'resolved' && !resolution) {
      Alert.alert('Ошибка', 'Укажите решение проблемы');
      return;
    }

    Alert.alert(
      'Подтверждение',
      `Изменить статус на "${status}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: () => {
            updateReport.mutate({
              id: selectedReport.id,
              status,
              resolution,
              adminNote,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Управление отчетами
        </Text>

        <View style={styles.filters}>
          <Button
            title="Ожидают"
            variant={selectedStatus === 'pending' ? 'primary' : 'secondary'}
            onPress={() => setSelectedStatus('pending')}
            style={styles.filterButton}
          />
          <Button
            title="В работе"
            variant={selectedStatus === 'in_progress' ? 'primary' : 'secondary'}
            onPress={() => setSelectedStatus('in_progress')}
            style={styles.filterButton}
          />
          <Button
            title="Решены"
            variant={selectedStatus === 'resolved' ? 'primary' : 'secondary'}
            onPress={() => setSelectedStatus('resolved')}
            style={styles.filterButton}
          />
          <Button
            title="Отклонены"
            variant={selectedStatus === 'rejected' ? 'primary' : 'secondary'}
            onPress={() => setSelectedStatus('rejected')}
            style={styles.filterButton}
          />
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.reportsList}>
          {reports?.map(report => (
            <Card
              key={report.id}
              style={[
                styles.reportCard,
                selectedReport?.id === report.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedReport(report)}
            >
              <View style={styles.reportHeader}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>
                  {report.book.title}
                </Text>
                <Text
                  style={[styles.reportMeta, { color: colors.textSecondary }]}
                >
                  {new Date(report.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Text style={[styles.reportType, { color: colors.text }]}>
                {report.type}
              </Text>

              <Text
                style={[
                  styles.selectedText,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                {report.selected_text}
              </Text>

              <Text
                style={[styles.description, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {report.description}
              </Text>
            </Card>
          ))}
        </ScrollView>

        {selectedReport && (
          <Card style={styles.detailsCard}>
            <ScrollView style={styles.details}>
              <Text style={[styles.detailsTitle, { color: colors.text }]}>
                Детали отчета
              </Text>

              <View style={styles.detailsSection}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Книга:
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {selectedReport.book.title} ({selectedReport.book.author})
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Отправитель:
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {selectedReport.user.email}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Тип проблемы:
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {selectedReport.type}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Выделенный текст:
                </Text>
                <Text
                  style={[
                    styles.selectedText,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  {selectedReport.selected_text}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Описание проблемы:
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {selectedReport.description}
                </Text>
              </View>

              {selectedReport.suggestion && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Предложение по исправлению:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {selectedReport.suggestion}
                  </Text>
                </View>
              )}

              <Input
                label="Решение"
                value={resolution}
                onChangeText={setResolution}
                multiline
                numberOfLines={3}
                placeholder="Опишите, как была решена проблема..."
                style={styles.input}
              />

              <Input
                label="Примечание администратора"
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
                numberOfLines={2}
                placeholder="Внутреннее примечание..."
                style={styles.input}
              />

              <View style={styles.actions}>
                <Button
                  title="Взять в работу"
                  variant="secondary"
                  onPress={() => handleUpdateStatus('in_progress')}
                  style={styles.actionButton}
                  disabled={selectedReport.status !== 'pending'}
                />
                <Button
                  title="Решено"
                  onPress={() => handleUpdateStatus('resolved')}
                  style={styles.actionButton}
                  disabled={selectedReport.status === 'resolved'}
                />
                <Button
                  title="Отклонить"
                  variant="outline"
                  onPress={() => handleUpdateStatus('rejected')}
                  style={styles.actionButton}
                  disabled={selectedReport.status === 'rejected'}
                />
              </View>
            </ScrollView>
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  reportsList: {
    flex: 1,
  },
  reportCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  selectedCard: {
    borderColor: BRAND_COLOR,
    borderWidth: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reportTitle: {
    ...typography.h2,
    flex: 1,
  },
  reportMeta: {
    ...typography.bodySmall,
  },
  reportType: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  selectedText: {
    ...typography.body,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
  },
  detailsCard: {
    flex: 1,
    maxWidth: 400,
    padding: spacing.lg,
  },
  details: {
    flex: 1,
  },
  detailsTitle: {
    ...typography.h2,
    marginBottom: spacing.xl,
  },
  detailsSection: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
  },
  input: {
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
