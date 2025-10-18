import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LayoutDashboard, Package, CheckCircle, TrendingUp, LogOut, User, Languages } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const { stats, isLoading } = useJackets();
  const { logout, user } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const t = useTranslations(language);
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      t.auth.logout,
      t.auth.logoutConfirm,
      [
        {
          text: t.common.cancel,
          style: 'cancel'
        },
        {
          text: t.auth.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      t.settings.language,
      t.settings.selectLanguage,
      [
        {
          text: t.settings.french,
          onPress: () => changeLanguage('fr'),
        },
        {
          text: t.settings.english,
          onPress: () => changeLanguage('en'),
        },
        {
          text: t.common.cancel,
          style: 'cancel',
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'MyJacket' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'MyJacket' }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{t.dashboard.title}</Text>
              <Text style={styles.subtitle}>{t.dashboard.subtitle}</Text>
            </View>
          </View>
          
          <View style={styles.userCard}>
            <View style={styles.userIcon}>
              <User size={20} color={Colors.dark.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.username}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <View style={styles.userActions}>
              <Pressable 
                onPress={handleLanguageChange}
                style={({ pressed }) => [styles.languageButton, pressed && styles.buttonPressed]}
              >
                <Languages size={20} color={Colors.dark.primary} />
              </Pressable>
              <Pressable 
                onPress={handleLogout}
                style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
              >
                <LogOut size={20} color={Colors.dark.error} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconContainer}>
              <Package size={24} color={Colors.dark.primary} />
            </View>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>{t.dashboard.activeJackets}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <CheckCircle size={24} color={Colors.dark.success} />
            </View>
            <Text style={styles.statValue}>{stats.retrieved}</Text>
            <Text style={styles.statLabel}>{t.dashboard.retrieved}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color={Colors.dark.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.todayDeposits}</Text>
            <Text style={styles.statLabel}>{t.dashboard.depositsToday}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <LayoutDashboard size={24} color={Colors.dark.warning} />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t.dashboard.total}</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{t.dashboard.quickActions}</Text>
          
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed
            ]}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.dark.primary + '20' }]}>
                <Package size={24} color={Colors.dark.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{t.dashboard.newDeposit}</Text>
                <Text style={styles.actionSubtitle}>{t.dashboard.newDepositDescription}</Text>
              </View>
            </View>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed
            ]}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.dark.success + '20' }]}>
                <CheckCircle size={24} color={Colors.dark.success} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{t.dashboard.scanQR}</Text>
                <Text style={styles.actionSubtitle}>{t.dashboard.scanQRDescription}</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  userCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.dark.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.dark.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statCardPrimary: {
    backgroundColor: Colors.dark.primary + '15',
    borderColor: Colors.dark.primary + '30',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  quickActions: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionButtonPressed: {
    backgroundColor: Colors.dark.cardHover,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
