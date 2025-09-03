import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { theme, typography, spacing, BRAND_COLOR } from '@/styles/theme';
import { LineChart } from 'react-native-chart-kit';

interface StatsCard {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
}

function StatCard({ title, value, change, icon }: StatsCard) {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={[styles.statIcon, { color: BRAND_COLOR }]}>{icon}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {change !== undefined && (
        <Text
          style={[
            styles.statChange,
            { color: change >= 0 ? '#10b981' : '#ef4444' },
          ]}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </Text>
      )}
    </Card>
  );
}

export function AdminDashboard() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];

  // Получаем общую статистику
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [
        { count: totalBooks },
        { count: totalUsers },
        { count: totalReads },
      ] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('progress').select('*', { count: 'exact' }),
      ]);

      return { totalBooks, totalUsers, totalReads };
    },
  });

  // Получаем статистику чтения по дням
  const { data: readingStats } = useQuery({
    queryKey: ['admin', 'reading-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('progress')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      // Группируем по дням
      const stats = data?.reduce((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(stats || {}).map(([date, count]) => ({
        date,
        count,
      }));
    },
  });

  // Получаем популярные книги
  const { data: popularBooks } = useQuery({
    queryKey: ['admin', 'popular-books'],
    queryFn: async () => {
      const { data } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          progress (count)
        `)
        .order('progress(count)', { ascending: false })
        .limit(5);

      return data;
    },
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Панель управления
      </Text>

      <View style={styles.statsGrid}>
        <StatCard
          title="Всего книг"
          value={stats?.totalBooks || 0}
          icon="📚"
        />
        <StatCard
          title="Пользователей"
          value={stats?.totalUsers || 0}
          icon="👥"
        />
        <StatCard
          title="Прочтений"
          value={stats?.totalReads || 0}
          icon="📖"
        />
      </View>

      <Card style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Активность чтения
        </Text>
        {readingStats && readingStats.length > 0 && (
          <LineChart
            data={{
              labels: readingStats.map(stat => stat.date),
              datasets: [{
                data: readingStats.map(stat => stat.count),
              }],
            }}
            width={350}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: () => BRAND_COLOR,
              labelColor: () => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        )}
      </Card>

      <Card style={styles.popularBooks}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Популярные книги
        </Text>
        {popularBooks?.map((book, index) => (
          <View key={book.id} style={styles.bookItem}>
            <Text style={[styles.bookRank, { color: BRAND_COLOR }]}>
              #{index + 1}
            </Text>
            <View style={styles.bookInfo}>
              <Text
                style={[styles.bookTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {book.title}
              </Text>
              <Text
                style={[styles.bookAuthor, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {book.author}
              </Text>
            </View>
            <Text style={[styles.bookReads, { color: colors.textSecondary }]}>
              {book.progress.count} чтений
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statIcon: {
    fontSize: 24,
  },
  statTitle: {
    ...typography.bodySmall,
  },
  statValue: {
    ...typography.h2,
  },
  statChange: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  chartCard: {
    padding: spacing.lg,
  },
  chartTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  chart: {
    marginVertical: spacing.md,
    borderRadius: 16,
  },
  popularBooks: {
    padding: spacing.lg,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bookRank: {
    ...typography.h2,
    width: 40,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  bookAuthor: {
    ...typography.bodySmall,
  },
  bookReads: {
    ...typography.bodySmall,
  },
});
