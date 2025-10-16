import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Package, Phone, Hash, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import Colors from '@/constants/colors';
import type { Jacket } from '@/types/jacket';

export default function PickupScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jackets, retrieveJacket } = useJackets();
  const [jacket, setJacket] = useState<Jacket | null>(null);

  useEffect(() => {
    const foundJacket = jackets.find(j => j.qrCode === id);
    setJacket(foundJacket || null);
  }, [id, jackets]);

  const handlePickup = () => {
    if (!jacket) return;

    Alert.alert(
      'Confirmer la récupération',
      'Le client a-t-il bien récupéré sa veste ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Confirmer',
          onPress: () => {
            retrieveJacket(jacket.id);
            Alert.alert(
              'Récupération confirmée',
              'La veste a été marquée comme récupérée.',
              [
                {
                  text: 'OK',
                  onPress: () => router.push('/')
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (!jacket) {
    return (
      <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Veste introuvable' }} />
        <View style={styles.errorContainer}>
          <XCircle size={64} color={Colors.dark.error} />
          <Text style={styles.errorTitle}>Veste introuvable</Text>
          <Text style={styles.errorText}>
            Le QR code scanné ne correspond à aucune veste enregistrée.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (jacket.status === 'retrieved') {
    return (
      <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Déjà récupérée' }} />
        <View style={styles.errorContainer}>
          <CheckCircle size={64} color={Colors.dark.warning} />
          <Text style={styles.errorTitle}>Veste déjà récupérée</Text>
          <Text style={styles.errorText}>
            Cette veste a déjà été récupérée le {new Date(jacket.retrievalTime!).toLocaleString('fr-FR')}.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const depositDate = new Date(jacket.depositTime);
  const duration = Math.floor((Date.now() - depositDate.getTime()) / (1000 * 60));

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Récupération' }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Package size={48} color={Colors.dark.primary} />
          </View>
          <Text style={styles.title}>Veste à récupérer</Text>
          <Text style={styles.subtitle}>Vérifiez les informations ci-dessous</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Hash size={24} color={Colors.dark.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Numéro de cintre</Text>
              <Text style={styles.infoValue}>{jacket.hangerNumber}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Phone size={24} color={Colors.dark.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone du client</Text>
              <Text style={styles.infoValue}>
                {jacket.countryCode} {jacket.phoneNumber}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Clock size={24} color={Colors.dark.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Déposée le</Text>
              <Text style={styles.infoValue}>
                {depositDate.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.durationText}>
                Il y a {duration < 60 ? `${duration} min` : `${Math.floor(duration / 60)}h ${duration % 60}min`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>📋 Instructions</Text>
          <Text style={styles.instructionText}>
            1. Vérifiez le numéro de cintre{'\n'}
            2. Récupérez la veste correspondante{'\n'}
            3. Confirmez la remise au client
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            pressed && styles.confirmButtonPressed
          ]}
          onPress={handlePickup}
        >
          <CheckCircle size={20} color={Colors.dark.text} />
          <Text style={styles.confirmButtonText}>Confirmer la récupération</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  durationText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 16,
  },
  instructionBox: {
    backgroundColor: Colors.dark.secondary + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.secondary + '30',
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.success,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonPressed: {
    opacity: 0.8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backButtonPressed: {
    backgroundColor: Colors.dark.cardHover,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
});
