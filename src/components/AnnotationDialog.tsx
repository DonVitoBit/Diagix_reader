import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { theme, typography, spacing, radius, BRAND_COLOR } from '@/styles/theme';
import type { HighlightColor, BookmarkCategory } from '@/lib/annotations';
import { categoryIcons, categoryLabels } from '@/lib/annotations';

interface BaseDialogProps {
  visible: boolean;
  onClose: () => void;
}

interface HighlightDialogProps extends BaseDialogProps {
  type: 'highlight';
  selectedText: string;
  onSave: (color: HighlightColor, note?: string) => void;
}

interface BookmarkDialogProps extends BaseDialogProps {
  type: 'bookmark';
  onSave: (category: BookmarkCategory, note?: string) => void;
}

type AnnotationDialogProps = HighlightDialogProps | BookmarkDialogProps;

export function AnnotationDialog(props: AnnotationDialogProps) {
  const { visible, onClose } = props;
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const [note, setNote] = useState('');

  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [selectedCategory, setSelectedCategory] = useState<BookmarkCategory>('other');

  const highlightColors: { value: HighlightColor; label: string; color: string }[] = [
    { value: 'yellow', label: 'Жёлтый', color: 'rgba(255, 235, 59, 0.3)' },
    { value: 'green', label: 'Зелёный', color: 'rgba(76, 175, 80, 0.3)' },
    { value: 'blue', label: 'Синий', color: 'rgba(33, 150, 243, 0.3)' },
  ];

  const categories = Object.entries(categoryLabels) as [BookmarkCategory, string][];

  const handleSave = () => {
    if (props.type === 'highlight') {
      props.onSave(selectedColor, note || undefined);
    } else {
      props.onSave(selectedCategory, note || undefined);
    }
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        onPress={onClose}
      >
        <Pressable>
          <Card
            variant="elevated"
            style={[
              styles.dialog,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              {props.type === 'highlight' ? 'Выделение текста' : 'Добавить закладку'}
            </Text>

            {props.type === 'highlight' && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>
                  Выбранный текст:
                </Text>
                <Text
                  style={[styles.selectedText, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {props.selectedText}
                </Text>

                <Text style={[styles.label, { color: colors.text }]}>
                  Цвет выделения:
                </Text>
                <View style={styles.colorGrid}>
                  {highlightColors.map(({ value, color }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        selectedColor === value && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedColor(value)}
                    />
                  ))}
                </View>
              </>
            )}

            {props.type === 'bookmark' && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>
                  Категория:
                </Text>
                <View style={styles.categoryGrid}>
                  {categories.map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.categoryButton,
                        { backgroundColor: colors.surfaceVariant },
                        selectedCategory === value && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedCategory(value)}
                    >
                      <Text style={styles.categoryIcon}>
                        {categoryIcons[value]}
                      </Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: colors.text },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Input
              label="Заметка (необязательно):"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="Добавьте заметку..."
            />

            <View style={styles.buttons}>
              <Button
                title="Отмена"
                onPress={onClose}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Сохранить"
                onPress={handleSave}
                style={styles.button}
              />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: Platform.OS === 'web' ? 400 : '90%',
    maxWidth: 500,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  selectedText: {
    ...typography.body,
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: '45%',
  },
  selectedOption: {
    borderColor: BRAND_COLOR,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  categoryLabel: {
    ...typography.body,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
