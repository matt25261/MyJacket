import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useJackets } from '@/contexts/JacketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
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
  dailyBreakdown: DailyStats[];
}

type ViewMode = 'day' | 'week';

interface SelectedWeek {
  weekStart: string;
  weekEnd: string;
}

export default function StatisticsScreen() {
  const { jackets } = useJackets();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek | null>(null);
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
          dailyBreakdown: [],
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
            dailyBreakdown: [],
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

      weekStats.dailyBreakdown = dailyStatsInWeek.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

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
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatWeekRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const maxHourlyValue = useMemo(() => {
    if (!selectedDateStats) return 1;
    return Math.max(
      ...selectedDateStats.map((s) => Math.max(s.arrivals, s.departures)),
      1
    );
  }, [selectedDateStats]);

  if (selectedWeek) {
    const weekData = weeklyStats.find(
      (w) => w.weekStart === selectedWeek.weekStart && w.weekEnd === selectedWeek.weekEnd
    );

    if (!weekData) {
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedWeek(null)}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.statistics.weekly}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.dateCard}>
            <Text style={styles.dateTitle}>
              {formatWeekRange(weekData.weekStart, weekData.weekEnd)}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.dark.success }]}>
                  {weekData.arrivals}
                </Text>
                <Text style={styles.statLabel}>{t.statistics.arrivals}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.dark.error }]}>
                  {weekData.departures}
                </Text>
                <Text style={styles.statLabel}>{t.statistics.departures}</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t.statistics.daily}</Text>
            {weekData.dailyBreakdown.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {t.statistics.noData}
                </Text>
              </View>
            ) : (
              weekData.dailyBreakdown.map((dayStats) => {
                const total = dayStats.arrivals + dayStats.departures;
                const maxTotal = Math.max(
                  ...weekData.dailyBreakdown.map((d) => d.arrivals + d.departures),
                  1
                );

                return (
                  <TouchableOpacity
                    key={dayStats.date}
                    style={styles.weekDayCard}
                    onPress={() => {
                      setSelectedWeek(null);
                      setSelectedDate(dayStats.date);
                    }}
                  >
                    <View style={styles.weekDayHeader}>
                      <Text style={styles.weekDayName}>
                        {new Date(dayStats.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      {weekData.peakDay === dayStats.date && (
                        <View style={styles.peakBadge}>
                          <Text style={styles.peakBadgeText}>{t.statistics.peakHour}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.weekDayStats}>
                      <View style={styles.weekDayStatRow}>
                        <View style={styles.weekDayStatLeft}>
                          <View
                            style={[
                              styles.statIndicator,
                              { backgroundColor: Colors.dark.success },
                            ]}
                          />
                          <Text style={styles.weekDayStatLabel}>{t.statistics.arrivals}</Text>
                        </View>
                        <Text style={styles.weekDayStatValue}>{dayStats.arrivals}</Text>
                      </View>
                      <View style={styles.weekDayStatRow}>
                        <View style={styles.weekDayStatLeft}>
                          <View
                            style={[
                              styles.statIndicator,
                              { backgroundColor: Colors.dark.error },
                            ]}
                          />
                          <Text style={styles.weekDayStatLabel}>{t.statistics.departures}</Text>
                        </View>
                        <Text style={styles.weekDayStatValue}>{dayStats.departures}</Text>
                      </View>
                    </View>

                    <View style={styles.activityBar}>
                      <View
                        style={[
                          styles.activityFill,
                          {
                            width: `${(total / maxTotal) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{t.statistics.daily}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.dateCard}>
            <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.dark.success }]}>
                  {selectedDateStats.reduce((sum, s) => sum + s.arrivals, 0)}
                </Text>
                <Text style={styles.statLabel}>{t.statistics.arrivals}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.dark.error }]}>
                  {selectedDateStats.reduce((sum, s) => sum + s.departures, 0)}
                </Text>
                <Text style={styles.statLabel}>{t.statistics.departures}</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{language === 'fr' ? 'Activité par heure' : 'Activity by hour'}</Text>
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
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{t.statistics.title}</Text>
      </View>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'day' && styles.tabActive]}
          onPress={() => setViewMode('day')}
        >
          <Calendar size={20} color={viewMode === 'day' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'day' && styles.tabTextActive]}>{t.statistics.daily}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'week' && styles.tabActive]}
          onPress={() => setViewMode('week')}
        >
          <CalendarDays size={20} color={viewMode === 'week' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'week' && styles.tabTextActive]}>{t.statistics.weekly}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {viewMode === 'day' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{language === 'fr' ? 'Vue globale par jour' : 'Daily overview'}</Text>
          {dailyStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {t.statistics.noData}
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
                    {t.statistics.peakHour}: {stats.peakHour}h ({stats.peakCount})
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
                    <Text style={styles.dayStatLabel}>{t.statistics.arrivals}</Text>
                    <Text style={styles.dayStatValue}>{stats.arrivals}</Text>
                  </View>
                  <View style={styles.dayStatItem}>
                    <View
                      style={[
                        styles.statIndicator,
                        { backgroundColor: Colors.dark.error },
                      ]}
                    />
                    <Text style={styles.dayStatLabel}>{t.statistics.departures}</Text>
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
            <Text style={styles.sectionTitle}>{language === 'fr' ? 'Vue globale par semaine' : 'Weekly overview'}</Text>
            {weeklyStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {t.statistics.noData}
                </Text>
              </View>
            ) : (
              weeklyStats.map((stats) => (
                <TouchableOpacity
                  key={stats.weekStart}
                  style={styles.weekCard}
                  onPress={() => setSelectedWeek({ weekStart: stats.weekStart, weekEnd: stats.weekEnd })}
                >
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekDate}>{formatWeekRange(stats.weekStart, stats.weekEnd)}</Text>
                    {stats.peakDay && (
                      <Text style={styles.peakInfo}>
                        {t.statistics.peakHour}: {new Date(stats.peakDay).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' })} ({stats.peakCount})
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
                      <Text style={styles.weekStatLabel}>{t.statistics.arrivals}</Text>
                      <Text style={[styles.weekStatValue, { color: Colors.dark.success }]}>{stats.arrivals}</Text>
                    </View>
                    <View style={styles.weekStatBox}>
                      <View
                        style={[
                          styles.statIndicator,
                          { backgroundColor: Colors.dark.error },
                        ]}
                      />
                      <Text style={styles.weekStatLabel}>{t.statistics.departures}</Text>
                      <Text style={[styles.weekStatValue, { color: Colors.dark.error }]}>{stats.departures}</Text>
                    </View>
                    <View style={styles.weekStatBox}>
                      <Text style={styles.weekStatLabel}>{language === 'fr' ? 'Total' : 'Total'}</Text>
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
                </TouchableOpacity>
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
    flex: 1,
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
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
  weekDayCard: {
    backgroundColor: Colors.dark.cardHover,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekDayName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    textTransform: 'capitalize',
  },
  peakBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  peakBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  weekDayStats: {
    gap: 4,
    marginBottom: 8,
  },
  weekDayStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekDayStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekDayStatLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  weekDayStatValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
});
