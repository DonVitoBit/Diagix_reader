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

type ContentStatus = 'pending' | 'approved' | 'rejected';
type ContentType = 'book' | 'comment' | 'review';

interface ContentItem {
  id: string;
  type: ContentType;
  status: ContentStatus;
  content: string;
  user_id: string;
  created_at: string;
  metadata: any;
}

export function Moderation() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ContentType>('book');
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus>('pending');
  const [note, setNote] = useState('');

  // Получаем контент для модерации
  const { data: contentItems } = useQuery({
    queryKey: ['moderation', selectedType, selectedStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select(`
          *,
          users:profiles(email),
          books(title, author)
        `)
        .eq('type', selectedType)
        .eq('status', selectedStatus)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContentItem[];
    },
  });

  // Мутация для обновления статуса
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      moderationNote,
    }: {
      id: string;
      status: ContentStatus;
      moderationNote: string;
    }) => {
      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status,
          moderation_note: moderationNote,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      setNote('');
    },
  });

  // Мутация для массового обновления
  const bulkUpdate = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: ContentStatus;
    }) => {
      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status,
          moderated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });

  const handleAction = (item: ContentItem, status: ContentStatus) => {
    Alert.alert(
      'Подтверждение',
      `${status === 'approved' ? 'Одобрить' : 'Отклонить'} контент?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: () => {
            updateStatus.mutate({
              id: item.id,
              status,
              moderationNote: note,
            });
          },
        },
      ]
    );
  };

  const renderContentItem = (item: ContentItem) => {
    switch (item.type) {
      case 'book':
        return (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {item.metadata.title}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                Автор: {item.metadata.author}
              </Text>
            </View>
            
            <View style={styles.itemDetails}>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>
                Формат:
              </Text>
              <Text style={[styles.itemValue, { color: colors.text }]}>
                {item.metadata.format.toUpperCase()}
              </Text>
            </View>

            <View style={styles.itemDetails}>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>
                Размер:
              </Text>
              <Text style={[styles.itemValue, { color: colors.text }]}>
                {(item.metadata.size_bytes / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>

            <Input
              label="Примечание модератора"
              value={note}
              onChangeText={setNote}
              multiline
              style={styles.noteInput}
            />

            <View style={styles.actions}>
              <Button
                title="Отклонить"
                variant="outline"
                onPress={() => handleAction(item, 'rejected')}
                style={styles.actionButton}
              />
              <Button
                title="Одобрить"
                onPress={() => handleAction(item, 'approved')}
                style={styles.actionButton}
              />
            </View>
          </Card>
        );

      case 'comment':
      case 'review':
        return (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {item.metadata.book_title}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                От: {item.metadata.user_email}
              </Text>
            </View>

            <Text style={[styles.content, { color: colors.text }]}>
              {item.content}
            </Text>

            <Input
              label="Примечание модератора"
              value={note}
              onChangeText={setNote}
              multiline
              style={styles.noteInput}
            />

            <View style={styles.actions}>
              <Button
                title="Отклонить"
                variant="outline"
                onPress={() => handleAction(item, 'rejected')}
                style={styles.actionButton}
              />
              <Button
                title="Одобрить"
                onPress={() => handleAction(item, 'approved')}
                style={styles.actionButton}
              />
            </View>
          </Card>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Модерация контента
        </Text>

        <View style={styles.filters}>
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Тип контента:
            </Text>
            <View style={styles.filterButtons}>
              <Button
                title="Книги"
                variant={selectedType === 'book' ? 'primary' : 'secondary'}
                onPress={() => setSelectedType('book')}
                style={styles.filterButton}
              />
              <Button
                title="Комментарии"
                variant={selectedType === 'comment' ? 'primary' : 'secondary'}
                onPress={() => setSelectedType('comment')}
                style={styles.filterButton}
              />
              <Button
                title="Отзывы"
                variant={selectedType === 'review' ? 'primary' : 'secondary'}
                onPress={() => setSelectedType('review')}
                style={styles.filterButton}
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              Статус:
            </Text>
            <View style={styles.filterButtons}>
              <Button
                title="Ожидает"
                variant={selectedStatus === 'pending' ? 'primary' : 'secondary'}
                onPress={() => setSelectedStatus('pending')}
                style={styles.filterButton}
              />
              <Button
                title="Одобрено"
                variant={selectedStatus === 'approved' ? 'primary' : 'secondary'}
                onPress={() => setSelectedStatus('approved')}
                style={styles.filterButton}
              />
              <Button
                title="Отклонено"
                variant={selectedStatus === 'rejected' ? 'primary' : 'secondary'}
                onPress={() => setSelectedStatus('rejected')}
                style={styles.filterButton}
              />
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {contentItems?.map(renderContentItem)}
        
        {contentItems?.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет контента для модерации
          </Text>
        )}
      </ScrollView>
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
    gap: spacing.lg,
  },
  filterGroup: {
    gap: spacing.md,
  },
  filterLabel: {
    ...typography.body,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  itemCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  itemHeader: {
    marginBottom: spacing.md,
  },
  itemTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  itemMeta: {
    ...typography.bodySmall,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemLabel: {
    ...typography.body,
    width: 100,
  },
  itemValue: {
    ...typography.body,
    flex: 1,
  },
  content: {
    ...typography.body,
    marginVertical: spacing.md,
  },
  noteInput: {
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
