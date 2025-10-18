import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useJackets } from '@/contexts/JacketContext';
import Colors from '@/constants/colors';
import { ArrowLeft, Calendar, CalendarDays } from 'lucide-react-native';

interface DailyStats {
  date: string;
  arrivals: number;
  departures: number;
  peakHour: number;
  peakCount: number;
}

interface HourlyStats {
  hour: number;
  arrivals: number;
  departures: number;
}

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  arrivals: number;
  departures: number;
  peakDay: string;
  peakCount: number;
}

type ViewMode = 'day' | 'week';

export default function StatisticsScreen() {
  const { jackets } = useJackets();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const getHourlyStats = useCallback((date: string): HourlyStats[] => {
    const hourlyMap = new Map<number, HourlyStats>();

    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { hour: i, arrivals: 0, departures: 0 });
    }

    jackets.forEach((jacket) => {
      const depositDate = new Date(jacket.depositTime);
      const depositDateKey = depositDate.toISOString().split('T')[0];

      if (depositDateKey === date) {
        const hour = depositDate.getHours();
        const stats = hourlyMap.get(hour)!;
        stats.arrivals += 1;
      }

      if (jacket.retrievalTime) {
        const retrievalDate = new Date(jacket.retrievalTime);
        const retrievalDateKey = retrievalDate.toISOString().split('T')[0];

        if (retrievalDateKey === date) {
          const hour = retrievalDate.getHours();
          const stats = hourlyMap.get(hour)!;
          stats.departures += 1;
        }
      }
    });

    return Array.from(hourlyMap.values());
  }, [jackets]);

  const dailyStats = useMemo(() => {
    const statsMap = new Map<string, DailyStats>();

    jackets.forEach((jacket) => {
      const depositDate = new Date(jacket.depositTime);
      const dateKey = depositDate.toISOString().split('T')[0];

      if (!statsMap.has(dateKey)) {
        statsMap.set(dateKey, {
          date: dateKey,
          arrivals: 0,
          departures: 0,
          peakHour: 0,
          peakCount: 0,
        });
      }

      const stats = statsMap.get(dateKey)!;
      stats.arrivals += 1;

      if (jacket.retrievalTime) {
        const retrievalDate = new Date(jacket.retrievalTime);
        const retrievalDateKey = retrievalDate.toISOString().split('T')[0];
        
        if (retrievalDateKey === dateKey) {
          stats.departures += 1;
        } else if (statsMap.has(retrievalDateKey)) {
          statsMap.get(retrievalDateKey)!.departures += 1;
        } else {
          statsMap.set(retrievalDateKey, {
            date: retrievalDateKey,
            arrivals: 0,
            departures: 1,
            peakHour: 0,
            peakCount: 0,
          });
        }
      }
    });

    statsMap.forEach((stats) => {
      const hourlyData = getHourlyStats(stats.date);
      const peak = hourlyData.reduce(
        (max, curr) => {
          const total = curr.arrivals + curr.departures;
          return total > max.count ? { hour: curr.hour, count: total } : max;
        },
        { hour: 0, count: 0 }
      );
      stats.peakHour = peak.hour;
      stats.peakCount = peak.count;
    });

    return Array.from(statsMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [jackets, getHourlyStats]);

  const getWeekKey = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    return startOfWeek.toISOString().split('T')[0];
  };

  const weeklyStats = useMemo(() => {
    const statsMap = new Map<string, WeeklyStats>();

    jackets.forEach((jacket) => {
      const depositDate = new Date(jacket.depositTime);
      const weekKey = getWeekKey(depositDate);

      if (!statsMap.has(weekKey)) {
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        statsMap.set(weekKey, {
          weekStart: weekKey,
          weekEnd: weekEnd.toISOString().split('T')[0],
          arrivals: 0,
          departures: 0,
          peakDay: '',
          peakCount: 0,
        });
      }

      const stats = statsMap.get(weekKey)!;
      stats.arrivals += 1;

      if (jacket.retrievalTime) {
        const retrievalDate = new Date(jacket.retrievalTime);
        const retrievalWeekKey = getWeekKey(retrievalDate);

        if (retrievalWeekKey === weekKey) {
          stats.departures += 1;
        } else if (statsMap.has(retrievalWeekKey)) {
          statsMap.get(retrievalWeekKey)!.departures += 1;
        } else {
          const weekStart = new Date(retrievalWeekKey);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          statsMap.set(retrievalWeekKey, {
            weekStart: retrievalWeekKey,
            weekEnd: weekEnd.toISOString().split('T')[0],
            arrivals: 0,
            departures: 1,
            peakDay: '',
            peakCount: 0,
          });
        }
      }
    });

    statsMap.forEach((weekStats) => {
      const dailyStatsInWeek = dailyStats.filter((ds) => {
        const date = new Date(ds.date);
        const dayWeekKey = getWeekKey(date);
        return dayWeekKey === weekStats.weekStart;
      });

      if (dailyStatsInWeek.length > 0) {
        const peak = dailyStatsInWeek.reduce((max, curr) => {
          const total = curr.arrivals + curr.departures;
          return total > max.count ? { day: curr.date, count: total } : max;
        }, { day: '', count: 0 });

        weekStats.peakDay = peak.day;
        weekStats.peakCount = peak.count;
      }
    });

    return Array.from(statsMap.values()).sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  }, [jackets, dailyStats]);

  const selectedDateStats = useMemo(() => {
    if (!selectedDate) return null;
    return getHourlyStats(selectedDate);
  }, [selectedDate, getHourlyStats]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatWeekRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const maxHourlyValue = useMemo(() => {
    if (!selectedDateStats) return 1;
    return Math.max(
      ...selectedDateStats.map((s) => Math.max(s.arrivals, s.departures)),
      1
    );
  }, [selectedDateStats]);

  if (selectedDate && selectedDateStats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedDate(null)}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du jour</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.dateCard}>
            <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.dark.success }]}>
                  {selectedDateStats.reduce((sum, s) => sum + s.arrivals, 0)}
                </Text>
                <Text style={styles.statLabel}>Arrivées</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.dark.error }]}>
                  {selectedDateStats.reduce((sum, s) => sum + s.departures, 0)}
                </Text>
                <Text style={styles.statLabel}>Départs</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Activité par heure</Text>
            {selectedDateStats.map((stat) => {
              const maxValue = Math.max(stat.arrivals, stat.departures);
              const hasActivity = maxValue > 0;

              return (
                <View key={stat.hour} style={styles.hourRow}>
                  <Text style={styles.hourLabel}>
                    {stat.hour.toString().padStart(2, '0')}h
                  </Text>
                  <View style={styles.barContainer}>
                    <View style={styles.barRow}>
                      <View
                        style={[
                          styles.bar,
                          styles.arrivalBar,
                          {
                            width: hasActivity
                              ? `${(stat.arrivals / maxHourlyValue) * 100}%`
                              : 0,
                          },
                        ]}
                      />
                      {stat.arrivals > 0 && (
                        <Text style={styles.barLabel}>{stat.arrivals}</Text>
                      )}
                    </View>
                    <View style={styles.barRow}>
                      <View
                        style={[
                          styles.bar,
                          styles.departureBar,
                          {
                            width: hasActivity
                              ? `${(stat.departures / maxHourlyValue) * 100}%`
                              : 0,
                          },
                        ]}
                      />
                      {stat.departures > 0 && (
                        <Text style={styles.barLabel}>{stat.departures}</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'day' && styles.tabActive]}
          onPress={() => setViewMode('day')}
        >
          <Calendar size={20} color={viewMode === 'day' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'day' && styles.tabTextActive]}>Par jour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'week' && styles.tabActive]}
          onPress={() => setViewMode('week')}
        >
          <CalendarDays size={20} color={viewMode === 'week' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'week' && styles.tabTextActive]}>Par semaine</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {viewMode === 'day' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vue globale par jour</Text>
          {dailyStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Aucune donnée disponible pour le moment
              </Text>
            </View>
          ) : (
            dailyStats.map((stats) => (
              <TouchableOpacity
                key={stats.date}
                style={styles.dayCard}
                onPress={() => setSelectedDate(stats.date)}
              >
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{formatDate(stats.date)}</Text>
                  <Text style={styles.peakInfo}>
                    Pic : {stats.peakHour}h ({stats.peakCount})
                  </Text>
                </View>
                <View style={styles.dayStats}>
                  <View style={styles.dayStatItem}>
                    <View
                      style={[
                        styles.statIndicator,
                        { backgroundColor: Colors.dark.success },
                      ]}
                    />
                    <Text style={styles.dayStatLabel}>Arrivées</Text>
                    <Text style={styles.dayStatValue}>{stats.arrivals}</Text>
                  </View>
                  <View style={styles.dayStatItem}>
                    <View
                      style={[
                        styles.statIndicator,
                        { backgroundColor: Colors.dark.error },
                      ]}
                    />
                    <Text style={styles.dayStatLabel}>Départs</Text>
                    <Text style={styles.dayStatValue}>{stats.departures}</Text>
                  </View>
                </View>
                <View style={styles.activityBar}>
                  <View
                    style={[
                      styles.activityFill,
                      {
                        width: stats.peakCount > 0 ? `${Math.min(100, (stats.peakCount / 10) * 100)}%` : '0%',
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vue globale par semaine</Text>
            {weeklyStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Aucune donnée disponible pour le moment
                </Text>
              </View>
            ) : (
              weeklyStats.map((stats) => (
                <View key={stats.weekStart} style={styles.weekCard}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekDate}>{formatWeekRange(stats.weekStart, stats.weekEnd)}</Text>
                    {stats.peakDay && (
                      <Text style={styles.peakInfo}>
                        Pic : {new Date(stats.peakDay).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })} ({stats.peakCount})
                      </Text>
                    )}
                  </View>
                  <View style={styles.weekStats}>
                    <View style={styles.weekStatBox}>
                      <View
                        style={[
                          styles.statIndicator,
                          { backgroundColor: Colors.dark.success },
                        ]}
                      />
                      <Text style={styles.weekStatLabel}>Arrivées</Text>
                      <Text style={[styles.weekStatValue, { color: Colors.dark.success }]}>{stats.arrivals}</Text>
                    </View>
                    <View style={styles.weekStatBox}>
                      <View
                        style={[
                          styles.statIndicator,
                          { backgroundColor: Colors.dark.error },
                        ]}
                      />
                      <Text style={styles.weekStatLabel}>Départs</Text>
                      <Text style={[styles.weekStatValue, { color: Colors.dark.error }]}>{stats.departures}</Text>
                    </View>
                    <View style={styles.weekStatBox}>
                      <Text style={styles.weekStatLabel}>Total</Text>
                      <Text style={[styles.weekStatValue, { color: Colors.dark.primary }]}>{stats.arrivals + stats.departures}</Text>
                    </View>
                  </View>
                  <View style={styles.activityBar}>
                    <View
                      style={[
                        styles.activityFill,
                        {
                          width: stats.peakCount > 0 ? `${Math.min(100, (stats.peakCount / 20) * 100)}%` : '0%',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
    textTransform: 'capitalize',
  },
  peakInfo: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500' as const,
  },
  dayStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  dayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayStatLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  dayStatValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  activityBar: {
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
  },
  dateCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  chartContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 20,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hourLabel: {
    width: 40,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  barContainer: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  bar: {
    height: 16,
    borderRadius: 4,
    minWidth: 2,
  },
  arrivalBar: {
    backgroundColor: Colors.dark.success,
  },
  departureBar: {
    backgroundColor: Colors.dark.error,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.dark.text,
    marginLeft: 6,
    fontWeight: '500' as const,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark.text,
    fontWeight: '600' as const,
  },
  weekCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  weekStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekStatLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  weekStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
});
