import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Package, Phone, Hash, XCircle, ArrowLeft } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useJackets } from '@/contexts/JacketContext';
import Colors from '@/constants/colors';
import type { Jacket } from '@/types/jacket';

export default function QRDisplayScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jackets } = useJackets();
  const [jacket, setJacket] = useState<Jacket | null>(null);

  useEffect(() => {
    const foundJacket = jackets.find(j => j.qrCode === id);
    setJacket(foundJacket || null);
  }, [id, jackets]);

  if (!jacket) {
    return (
      <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'QR Code introuvable', headerShown: false }} />
        <View style={styles.errorContainer}>
          <XCircle size={64} color={Colors.dark.error} />
          <Text style={styles.errorTitle}>QR Code introuvable</Text>
          <Text style={styles.errorText}>
            Le lien ne correspond à aucune veste enregistrée.
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
        <Stack.Screen options={{ title: 'Veste récupérée', headerShown: false }} />
        <View style={styles.errorContainer}>
          <Package size={64} color={Colors.dark.warning} />
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

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Mon QR Code', headerShown: false }} />
      
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backIconButton,
            pressed && styles.backIconButtonPressed
          ]}
          onPress={() => router.push('/')}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Package size={48} color={Colors.dark.primary} />
          </View>
          
          <Text style={styles.title}>Votre QR Code</Text>
          <Text style={styles.subtitle}>
            Présentez ce code au vestiaire pour récupérer votre veste
          </Text>

          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={jacket.deepLink || `myapp://pickup/qr/${jacket.qrCode}`}
                size={280}
                backgroundColor="white"
                color="black"
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Hash size={20} color={Colors.dark.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Numéro de cintre</Text>
                <Text style={styles.infoValue}>{jacket.hangerNumber}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Phone size={20} color={Colors.dark.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>
                  {jacket.countryCode} {jacket.phoneNumber}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>📱 Instructions</Text>
            <Text style={styles.instructionText}>
              1. Montrez ce QR code au personnel du vestiaire{'\n'}
              2. Ils scanneront le code pour vérifier vos informations{'\n'}
              3. Vous récupérerez votre veste au cintre n°{jacket.hangerNumber}
            </Text>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backIconButtonPressed: {
    backgroundColor: Colors.dark.cardHover,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 16,
  },
  instructionBox: {
    width: '100%',
    backgroundColor: Colors.dark.secondary + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.secondary + '30',
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
    lineHeight: 24,
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
