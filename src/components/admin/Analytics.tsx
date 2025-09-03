import React, { useState } from 'react';
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
import { Button } from '@/components/Button';
import { theme, typography, spacing, BRAND_COLOR } from '@/styles/theme';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';
import dayjs from 'dayjs';

type TimeRange = '7d' | '30d' | '90d' | '1y';
type MetricType = 'reads' | 'users' | 'completion';

export function Analytics() {
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('reads');

  // Получаем статистику чтения
  const { data: readingStats } = useQuery({
    queryKey: ['analytics', 'reading', timeRange],
    queryFn: async () => {
      const startDate = dayjs().subtract(
        timeRange === '7d' ? 7 :
        timeRange === '30d' ? 30 :
        timeRange === '90d' ? 90 : 365,
        'day'
      ).toISOString();

      const { data } = await supabase
        .from('progress')
        .select(`
          created_at,
          percent,
          books (
            title,
            format
          )
        `)
        .gte('created_at', startDate)
        .order('created_at');

      return data || [];
    },
  });

  // Получаем статистику по форматам
  const { data: formatStats } = useQuery({
    queryKey: ['analytics', 'formats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('books')
        .select('format')
        .order('format');

      return data?.reduce((acc, curr) => {
        acc[curr.format] = (acc[curr.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
    },
  });

  // Получаем статистику завершения чтения
  const { data: completionStats } = useQuery({
    queryKey: ['analytics', 'completion'],
    queryFn: async () => {
      const { data } = await supabase
        .from('progress')
        .select('percent')
        .order('percent');

      return {
        completed: data?.filter(p => p.percent === 100).length || 0,
        inProgress: data?.filter(p => p.percent > 0 && p.percent < 100).length || 0,
        notStarted: data?.filter(p => p.percent === 0).length || 0,
      };
    },
  });

  // Подготавливаем данные для графиков
  const readingData = React.useMemo(() => {
    if (!readingStats) return null;

    const grouped = readingStats.reduce((acc, curr) => {
      const date = dayjs(curr.created_at).format('DD.MM');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(grouped),
      datasets: [{
        data: Object.values(grouped),
      }],
    };
  }, [readingStats]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Аналитика
        </Text>

        <View style={styles.timeRangeButtons}>
          <Button
            title="7 дней"
            variant={timeRange === '7d' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('7d')}
            style={styles.timeButton}
          />
          <Button
            title="30 дней"
            variant={timeRange === '30d' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('30d')}
            style={styles.timeButton}
          />
          <Button
            title="90 дней"
            variant={timeRange === '90d' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('90d')}
            style={styles.timeButton}
          />
          <Button
            title="1 год"
            variant={timeRange === '1y' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('1y')}
            style={styles.timeButton}
          />
        </View>
      </View>

      {readingData && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Активность чтения
          </Text>
          <LineChart
            data={readingData}
            width={350}
            height={220}
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
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: BRAND_COLOR,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {formatStats && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Распределение форматов
          </Text>
          <PieChart
            data={Object.entries(formatStats).map(([format, count]) => ({
              name: format.toUpperCase(),
              count,
              color: format === 'epub' ? BRAND_COLOR : '#4CAF50',
              legendFontColor: colors.text,
            }))}
            width={350}
            height={220}
            chartConfig={{
              color: () => colors.text,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </Card>
      )}

      {completionStats && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Статистика завершения
          </Text>
          <BarChart
            data={{
              labels: ['Завершено', 'В процессе', 'Не начато'],
              datasets: [{
                data: [
                  completionStats.completed,
                  completionStats.inProgress,
                  completionStats.notStarted,
                ],
              }],
            }}
            width={350}
            height={220}
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
              barPercentage: 0.5,
            }}
            style={styles.chart}
          />
        </Card>
      )}

      <Card style={styles.statsCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Ключевые метрики
        </Text>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {readingStats?.length || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Всего чтений
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {completionStats?.completed || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Завершено книг
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {Math.round(
                ((completionStats?.completed || 0) /
                  (readingStats?.length || 1)) *
                  100
              )}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Процент завершения
            </Text>
          </View>
        </View>
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
  header: {
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeButton: {
    flex: 1,
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
  statsCard: {
    padding: spacing.lg,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    ...typography.bodySmall,
  },
});
