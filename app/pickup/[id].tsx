import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Package, Phone, Hash, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import Colors from '@/constants/colors';
import type { Jacket } from '@/types/jacket';

export default function PickupScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jackets, retrieveJacket } = useJackets();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [jacket, setJacket] = useState<Jacket | null>(null);

  useEffect(() => {
    const foundJacket = jackets.find(j => j.qrCode === id);
    setJacket(foundJacket || null);
  }, [id, jackets]);

  const handlePickup = () => {
    if (!jacket) return;

    Alert.alert(
      t.pickup.confirmPickup,
      language === 'fr' ? 'Le client a-t-il bien récupéré sa veste ?' : 'Has the customer retrieved their jacket?',
      [
        {
          text: t.common.cancel,
          style: 'cancel'
        },
        {
          text: t.common.confirm,
          onPress: () => {
            retrieveJacket(jacket.id);
            Alert.alert(
              language === 'fr' ? 'Récupération confirmée' : 'Pickup confirmed',
              language === 'fr' ? 'La veste a été marquée comme récupérée.' : 'The jacket has been marked as retrieved.',
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
        <Stack.Screen options={{ title: t.pickup.notFound }} />
        <View style={styles.errorContainer}>
          <XCircle size={64} color={Colors.dark.error} />
          <Text style={styles.errorTitle}>{t.pickup.notFound}</Text>
          <Text style={styles.errorText}>
            {language === 'fr' ? 'Le QR code scanné ne correspond à aucune veste enregistrée.' : 'The scanned QR code does not match any registered jacket.'}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>{language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (jacket.status === 'retrieved') {
    return (
      <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: language === 'fr' ? 'Déjà récupérée' : 'Already retrieved' }} />
        <View style={styles.errorContainer}>
          <CheckCircle size={64} color={Colors.dark.warning} />
          <Text style={styles.errorTitle}>{t.pickup.alreadyRetrieved}</Text>
          <Text style={styles.errorText}>
            {language === 'fr' 
              ? `Cette veste a déjà été récupérée le ${new Date(jacket.retrievalTime!).toLocaleString('fr-FR')}.`
              : `This jacket was already retrieved on ${new Date(jacket.retrievalTime!).toLocaleString('en-US')}.`}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>{language === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const depositDate = new Date(jacket.depositTime);
  const duration = Math.floor((Date.now() - depositDate.getTime()) / (1000 * 60));

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: t.pickup.title }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Package size={48} color={Colors.dark.primary} />
          </View>
          <Text style={styles.title}>{language === 'fr' ? 'Veste à récupérer' : 'Jacket to retrieve'}</Text>
          <Text style={styles.subtitle}>{language === 'fr' ? 'Vérifiez les informations ci-dessous' : 'Check the information below'}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Hash size={24} color={Colors.dark.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{language === 'fr' ? 'Numéro de cintre' : 'Hanger number'}</Text>
              <Text style={styles.infoValue}>{jacket.hangerNumber}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Phone size={24} color={Colors.dark.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{language === 'fr' ? 'Téléphone du client' : 'Customer phone'}</Text>
              <Text style={styles.infoValue}>
                {jacket.countryCode} {jacket.phoneNumber}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Clock size={24} color={Colors.dark.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{language === 'fr' ? 'Déposée le' : 'Deposited on'}</Text>
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
          <Text style={styles.instructionTitle}>📋 {language === 'fr' ? 'Instructions' : 'Instructions'}</Text>
          <Text style={styles.instructionText}>
            {language === 'fr' 
              ? '1. Vérifiez le numéro de cintre\n2. Récupérez la veste correspondante\n3. Confirmez la remise au client'
              : '1. Check the hanger number\n2. Retrieve the corresponding jacket\n3. Confirm delivery to customer'}
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
          <Text style={styles.confirmButtonText}>{t.pickup.confirm}</Text>
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
