import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LayoutDashboard, Package, CheckCircle, TrendingUp, LogOut } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const { stats, isLoading } = useJackets();
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'MyJacket' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'MyJacket',
          headerRight: () => (
            <Pressable onPress={handleLogout} style={{ marginRight: 16 }}>
              <LogOut size={24} color={Colors.dark.text} />
            </Pressable>
          ),
        }} 
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tableau de bord</Text>
          <Text style={styles.subtitle}>Vue d'ensemble de votre vestiaire</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconContainer}>
              <Package size={24} color={Colors.dark.primary} />
            </View>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Vestes actives</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <CheckCircle size={24} color={Colors.dark.success} />
            </View>
            <Text style={styles.statValue}>{stats.retrieved}</Text>
            <Text style={styles.statLabel}>Récupérées</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color={Colors.dark.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.todayDeposits}</Text>
            <Text style={styles.statLabel}>Dépôts aujourd'hui</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <LayoutDashboard size={24} color={Colors.dark.warning} />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
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
                <Text style={styles.actionTitle}>Nouveau dépôt</Text>
                <Text style={styles.actionSubtitle}>Enregistrer une nouvelle veste</Text>
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
                <Text style={styles.actionTitle}>Scanner QR Code</Text>
                <Text style={styles.actionSubtitle}>Récupérer une veste</Text>
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
