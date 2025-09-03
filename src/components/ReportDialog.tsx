import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Modal,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { theme, typography, spacing, radius } from '@/styles/theme';

interface ReportDialogProps {
  visible: boolean;
  onClose: () => void;
  bookId: string;
  selectedText: string;
  cfi: string;
  onSuccess?: () => void;
}

type ReportType = 'incorrect' | 'typo' | 'formatting' | 'other';

const reportTypes: { id: ReportType; title: string; description: string }[] = [
  {
    id: 'incorrect',
    title: 'Некорректная информация',
    description: 'Информация в тексте является неверной или устаревшей',
  },
  {
    id: 'typo',
    title: 'Опечатка',
    description: 'В тексте есть орфографическая или пунктуационная ошибка',
  },
  {
    id: 'formatting',
    title: 'Проблема форматирования',
    description: 'Проблемы с отображением текста, символами или разметкой',
  },
  {
    id: 'other',
    title: 'Другое',
    description: 'Другая проблема с текстом',
  },
];

export function ReportDialog({
  visible,
  onClose,
  bookId,
  selectedText,
  cfi,
  onSuccess,
}: ReportDialogProps) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [type, setType] = useState<ReportType>('incorrect');
  const [description, setDescription] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('reports')
        .insert([{
          user_id: user.id,
          book_id: bookId,
          cfi,
          selected_text: selectedText,
          type,
          description,
          suggestion,
          status: 'pending',
        }]);

      if (error) throw error;

      onSuccess?.();
      onClose();
      setDescription('');
      setSuggestion('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Не удалось отправить отчет. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Сообщить о проблеме
          </Text>

          <ScrollView style={styles.content}>
            <Text style={[styles.label, { color: colors.text }]}>
              Выделенный текст:
            </Text>
            <Text
              style={[styles.selectedText, { backgroundColor: colors.surfaceVariant }]}
            >
              {selectedText}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              Тип проблемы:
            </Text>
            <View style={styles.typeButtons}>
              {reportTypes.map(reportType => (
                <Button
                  key={reportType.id}
                  title={reportType.title}
                  variant={type === reportType.id ? 'primary' : 'secondary'}
                  onPress={() => setType(reportType.id)}
                  style={styles.typeButton}
                />
              ))}
            </View>

            <Text
              style={[styles.typeDescription, { color: colors.textSecondary }]}
            >
              {reportTypes.find(t => t.id === type)?.description}
            </Text>

            <Input
              label="Описание проблемы"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder="Опишите, в чем заключается проблема..."
              style={styles.input}
            />

            <Input
              label="Предложение по исправлению (необязательно)"
              value={suggestion}
              onChangeText={setSuggestion}
              multiline
              numberOfLines={3}
              placeholder="Как бы вы предложили исправить этот текст..."
              style={styles.input}
            />
          </ScrollView>

          <View style={styles.buttons}>
            <Button
              title="Отмена"
              variant="secondary"
              onPress={onClose}
              style={styles.button}
            />
            <Button
              title="Отправить"
              onPress={handleSubmit}
              loading={loading}
              disabled={!description.trim()}
              style={styles.button}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  content: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  selectedText: {
    ...typography.body,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    minWidth: '45%',
  },
  typeDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
