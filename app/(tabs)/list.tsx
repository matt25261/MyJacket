import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Package, CheckCircle, Phone, Hash, Clock } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import { Jacket } from '@/types/jacket';
import Colors from '@/constants/colors';

type FilterType = 'all' | 'active' | 'retrieved';

export default function ListScreen() {
  const { jackets, isLoading } = useJackets();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredJackets = jackets.filter(jacket => {
    if (filter === 'all') return true;
    return jacket.status === filter;
  });

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderJacket = ({ item }: { item: Jacket }) => (
    <View style={styles.jacketCard}>
      <View style={styles.jacketHeader}>
        <View style={[
          styles.statusBadge,
          item.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeRetrieved
        ]}>
          {item.status === 'active' ? (
            <Package size={16} color={Colors.dark.primary} />
          ) : (
            <CheckCircle size={16} color={Colors.dark.success} />
          )}
          <Text style={[
            styles.statusText,
            item.status === 'active' ? styles.statusTextActive : styles.statusTextRetrieved
          ]}>
            {item.status === 'active' ? 'Active' : 'Récupérée'}
          </Text>
        </View>
        <Text style={styles.hangerNumberBadge}>{item.hangerNumber}</Text>
      </View>

      <View style={styles.jacketInfo}>
        <View style={styles.infoRow}>
          <Phone size={18} color={Colors.dark.textSecondary} />
          <Text style={styles.infoText}>{item.phoneNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Hash size={18} color={Colors.dark.textSecondary} />
          <Text style={styles.infoText}>{item.qrCode}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={18} color={Colors.dark.textSecondary} />
          <Text style={styles.infoText}>
            Déposée {formatDate(item.depositTime)}
          </Text>
        </View>
        {item.retrievalTime && (
          <View style={styles.infoRow}>
            <CheckCircle size={18} color={Colors.dark.success} />
            <Text style={styles.infoText}>
              Récupérée {formatDate(item.retrievalTime)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Liste des vestes' }} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Liste des vestes' }} />
      
      <View style={styles.filterContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
            pressed && styles.filterButtonPressed
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' && styles.filterButtonTextActive
          ]}>
            Toutes ({jackets.length})
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'active' && styles.filterButtonActive,
            pressed && styles.filterButtonPressed
          ]}
          onPress={() => setFilter('active')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'active' && styles.filterButtonTextActive
          ]}>
            Actives ({jackets.filter(j => j.status === 'active').length})
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'retrieved' && styles.filterButtonActive,
            pressed && styles.filterButtonPressed
          ]}
          onPress={() => setFilter('retrieved')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'retrieved' && styles.filterButtonTextActive
          ]}>
            Récupérées ({jackets.filter(j => j.status === 'retrieved').length})
          </Text>
        </Pressable>
      </View>

      {filteredJackets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color={Colors.dark.textTertiary} />
          <Text style={styles.emptyTitle}>Aucune veste</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'Commencez par enregistrer un dépôt'
              : filter === 'active'
              ? 'Aucune veste active pour le moment'
              : 'Aucune veste récupérée pour le moment'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredJackets}
          renderItem={renderJacket}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  filterButtonPressed: {
    opacity: 0.8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.dark.text,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  jacketCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  jacketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: Colors.dark.primary + '20',
  },
  statusBadgeRetrieved: {
    backgroundColor: Colors.dark.success + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusTextActive: {
    color: Colors.dark.primary,
  },
  statusTextRetrieved: {
    color: Colors.dark.success,
  },
  hangerNumberBadge: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  jacketInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});
