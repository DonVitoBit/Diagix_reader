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
import { TouchableScale } from '@/components/TouchableScale';
import { theme, typography, spacing, radius, BRAND_COLOR } from '@/styles/theme';

interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string;
}

export function UserManagement() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Получаем список пользователей
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          last_sign_in_at,
          is_admin
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as User[];
    },
  });

  // Мутация для изменения прав администратора
  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const { error } = await supabase.rpc('set_admin_status', {
        target_user_id: userId,
        admin_status: isAdmin,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Мутация для удаления пользователя
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const handleToggleAdmin = (user: User) => {
    Alert.alert(
      'Подтверждение',
      `${user.is_admin ? 'Отозвать' : 'Предоставить'} права администратора для ${user.email}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: () => {
            toggleAdmin.mutate({
              userId: user.id,
              isAdmin: !user.is_admin,
            });
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Подтверждение',
      `Удалить пользователя ${user.email}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            deleteUser.mutate(user.id);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Управление пользователями
        </Text>
        <Input
          placeholder="Поиск по email"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView style={styles.list}>
        {users?.map(user => (
          <TouchableScale
            key={user.id}
            onPress={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
            scale={0.98}
          >
            <Card
              style={[
                styles.userCard,
                selectedUser?.id === user.id && {
                  borderColor: BRAND_COLOR,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.userInfo}>
                <Text style={[styles.userEmail, { color: colors.text }]}>
                  {user.email}
                </Text>
                <Text
                  style={[styles.userMeta, { color: colors.textSecondary }]}
                >
                  Создан: {new Date(user.created_at).toLocaleDateString()}
                </Text>
                {user.is_admin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Админ</Text>
                  </View>
                )}
              </View>

              {selectedUser?.id === user.id && (
                <View style={styles.userActions}>
                  <Button
                    title={user.is_admin ? 'Отозвать права админа' : 'Сделать админом'}
                    onPress={() => handleToggleAdmin(user)}
                    variant="secondary"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Удалить пользователя"
                    onPress={() => handleDeleteUser(user)}
                    variant="outline"
                    style={styles.actionButton}
                  />
                </View>
              )}
            </Card>
          </TouchableScale>
        ))}
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
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  list: {
    padding: spacing.md,
  },
  userCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  userEmail: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  userMeta: {
    ...typography.bodySmall,
  },
  adminBadge: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  adminBadgeText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
  userActions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    marginTop: spacing.xs,
  },
});
