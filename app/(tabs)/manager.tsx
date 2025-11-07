import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import Colors from '@/constants/colors';
import { Calendar, CalendarDays, TrendingUp } from 'lucide-react-native';
import { Jacket } from '@/types/jacket';
import { useFocusEffect } from '@react-navigation/native';

const VALID_USERS = ['admin', 'vestiaire', 'seb'];

interface AccountStats {
  username: string;
  total: number;
  active: number;
  retrieved: number;
  jackets: Jacket[];
}

interface DailyStats {
  date: string;
  arrivals: number;
  departures: number;
  peakHour: number;
  peakCount: number;
}

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  arrivals: number;
  departures: number;
  peakDay: string;
  peakCount: number;
}

type ViewMode = 'overview' | 'day' | 'week';

export default function ManagerScreen() {
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [allAccountStats, setAllAccountStats] = useState<AccountStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const loadAllAccountData = useCallback(async () => {
    setIsLoading(true);
    try {
      const statsPromises = VALID_USERS.map(async (username) => {
        const storageKey = `@myjacket_data_${username}`;
        const stored = await AsyncStorage.getItem(storageKey);
        const jackets: Jacket[] = stored ? JSON.parse(stored) : [];
        
        return {
          username,
          total: jackets.length,
          active: jackets.filter(j => j.status === 'active').length,
          retrieved: jackets.filter(j => j.status === 'retrieved').length,
          jackets,
        };
      });

      const stats = await Promise.all(statsPromises);
      setAllAccountStats(stats);
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllAccountData();
    }, [loadAllAccountData])
  );

  const globalStats = useMemo(() => {
    const allJackets = allAccountStats.flatMap(acc => acc.jackets);
    return {
      total: allJackets.length,
      active: allJackets.filter(j => j.status === 'active').length,
      retrieved: allJackets.filter(j => j.status === 'retrieved').length,
      allJackets,
    };
  }, [allAccountStats]);

  const getWeekKey = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    return startOfWeek.toISOString().split('T')[0];
  };

  const dailyStats = useMemo(() => {
    const statsMap = new Map<string, DailyStats>();
    const allJackets = globalStats.allJackets;

    allJackets.forEach((jacket) => {
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
      const hourlyMap = new Map<number, number>();
      allJackets.forEach((jacket) => {
        const depositDate = new Date(jacket.depositTime);
        if (depositDate.toISOString().split('T')[0] === stats.date) {
          const hour = depositDate.getHours();
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        }
        if (jacket.retrievalTime) {
          const retrievalDate = new Date(jacket.retrievalTime);
          if (retrievalDate.toISOString().split('T')[0] === stats.date) {
            const hour = retrievalDate.getHours();
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
          }
        }
      });

      let maxHour = 0;
      let maxCount = 0;
      hourlyMap.forEach((count, hour) => {
        if (count > maxCount) {
          maxCount = count;
          maxHour = hour;
        }
      });
      stats.peakHour = maxHour;
      stats.peakCount = maxCount;
    });

    return Array.from(statsMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [globalStats.allJackets]);

  const weeklyStats = useMemo(() => {
    const statsMap = new Map<string, WeeklyStats>();
    const allJackets = globalStats.allJackets;

    allJackets.forEach((jacket) => {
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
  }, [globalStats.allJackets, dailyStats]);

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.manager.title}</Text>
          <Text style={styles.headerSubtitle}>{t.manager.subtitle}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.manager.title}</Text>
        <Text style={styles.headerSubtitle}>{t.manager.subtitle}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'overview' && styles.tabActive]}
          onPress={() => setViewMode('overview')}
        >
          <TrendingUp size={20} color={viewMode === 'overview' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'overview' && styles.tabTextActive]}>
            {t.manager.statsOverview}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'day' && styles.tabActive]}
          onPress={() => setViewMode('day')}
        >
          <Calendar size={20} color={viewMode === 'day' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'day' && styles.tabTextActive]}>
            {t.manager.dailyStats}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'week' && styles.tabActive]}
          onPress={() => setViewMode('week')}
        >
          <CalendarDays size={20} color={viewMode === 'week' ? Colors.dark.text : Colors.dark.textSecondary} />
          <Text style={[styles.tabText, viewMode === 'week' && styles.tabTextActive]}>
            {t.manager.weeklyStats}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {viewMode === 'overview' && (
          <>
            <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: Colors.dark.primary }]}>
                  <Text style={styles.statValue}>{globalStats.total}</Text>
                  <Text style={styles.statLabel}>{t.manager.totalJackets}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: Colors.dark.success }]}>
                  <Text style={styles.statValue}>{globalStats.active}</Text>
                  <Text style={styles.statLabel}>{t.manager.active}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: Colors.dark.error }]}>
                  <Text style={styles.statValue}>{globalStats.retrieved}</Text>
                  <Text style={styles.statLabel}>{t.manager.retrieved}</Text>
                </View>
              </View>
            </View>

            <View style={styles.accountsSection}>
              <Text style={styles.sectionTitle}>{t.manager.byAccount}</Text>
              {allAccountStats.map((accountStat) => (
                <View key={accountStat.username} style={styles.accountCard}>
                  <View style={styles.accountHeader}>
                    <Text style={styles.accountName}>{accountStat.username}</Text>
                    <Text style={styles.accountTotal}>{accountStat.total}</Text>
                  </View>
                  <View style={styles.accountStatsContainer}>
                    <View style={styles.accountStatRow}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.primary }]} />
                      <Text style={styles.accountStatLabel}>{language === 'fr' ? 'Déposées' : 'Deposited'}</Text>
                      <Text style={styles.accountStatValue}>{accountStat.total}</Text>
                    </View>
                  </View>
                  <View style={styles.accountStats}>
                    <View style={styles.accountStatItem}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.success }]} />
                      <Text style={styles.accountStatLabel}>{t.manager.active}</Text>
                      <Text style={styles.accountStatValue}>{accountStat.active}</Text>
                    </View>
                    <View style={styles.accountStatItem}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.error }]} />
                      <Text style={styles.accountStatLabel}>{t.manager.retrieved}</Text>
                      <Text style={styles.accountStatValue}>{accountStat.retrieved}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: accountStat.total > 0 
                            ? `${(accountStat.active / accountStat.total) * 100}%` 
                            : '0%',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {viewMode === 'day' && (
          <View style={styles.statsDetailSection}>
            {dailyStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t.statistics.noData}</Text>
              </View>
            ) : (
              dailyStats.map((stats) => (
                <View key={stats.date} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>{formatDate(stats.date)}</Text>
                    <Text style={styles.peakInfo}>
                      {t.statistics.peakHour}: {stats.peakHour}h ({stats.peakCount})
                    </Text>
                  </View>
                  <View style={styles.dayStats}>
                    <View style={styles.dayStatItem}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.success }]} />
                      <Text style={styles.dayStatLabel}>{t.statistics.arrivals}</Text>
                      <Text style={styles.dayStatValue}>{stats.arrivals}</Text>
                    </View>
                    <View style={styles.dayStatItem}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.error }]} />
                      <Text style={styles.dayStatLabel}>{t.statistics.departures}</Text>
                      <Text style={styles.dayStatValue}>{stats.departures}</Text>
                    </View>
                  </View>
                  <View style={styles.activityBar}>
                    <View
                      style={[
                        styles.activityFill,
                        {
                          width: stats.peakCount > 0 
                            ? `${Math.min(100, (stats.peakCount / 10) * 100)}%` 
                            : '0%',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {viewMode === 'week' && (
          <View style={styles.statsDetailSection}>
            {weeklyStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t.statistics.noData}</Text>
              </View>
            ) : (
              weeklyStats.map((stats) => (
                <View key={stats.weekStart} style={styles.weekCard}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekDate}>{formatWeekRange(stats.weekStart, stats.weekEnd)}</Text>
                    {stats.peakDay && (
                      <Text style={styles.peakInfo}>
                        {t.statistics.peakDay}: {new Date(stats.peakDay).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' })} ({stats.peakCount})
                      </Text>
                    )}
                  </View>
                  <View style={styles.weekStats}>
                    <View style={styles.weekStatBox}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.success }]} />
                      <Text style={styles.weekStatLabel}>{t.statistics.arrivals}</Text>
                      <Text style={[styles.weekStatValue, { color: Colors.dark.success }]}>{stats.arrivals}</Text>
                    </View>
                    <View style={styles.weekStatBox}>
                      <View style={[styles.statIndicator, { backgroundColor: Colors.dark.error }]} />
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
                          width: stats.peakCount > 0 
                            ? `${Math.min(100, (stats.peakCount / 20) * 100)}%` 
                            : '0%',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark.text,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.text,
    opacity: 0.9,
    textAlign: 'center',
  },
  accountsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    textTransform: 'capitalize',
  },
  accountTotal: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.primary,
  },
  accountStatsContainer: {
    marginBottom: 8,
  },
  accountStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accountStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  accountStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountStatLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  accountStatValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.success,
  },
  statsDetailSection: {
    padding: 20,
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
