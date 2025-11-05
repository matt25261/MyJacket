import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Shield, Lock, Clock, UserX } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function PublicPrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Protection des Données' }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Shield size={48} color={Colors.dark.primary} />
          <Text style={styles.title}>Protection des Données</Text>
          <Text style={styles.subtitle}>
            Nous prenons la protection de vos données très au sérieux.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>Données Collectées</Text>
          </View>
          <Text style={styles.sectionText}>
            Nous collectons uniquement votre numéro de téléphone et les horodatages (arrivée et départ) nécessaires pour gérer le dépôt de votre veste. Aucune autre donnée personnelle n&apos;est collectée.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>Sécurité des Données</Text>
          </View>
          <Text style={styles.sectionText}>
            Nous utilisons les meilleures pratiques de sécurité pour protéger vos données :
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>
              • Chiffrement AES-256 pour tous les numéros de téléphone
            </Text>
            <Text style={styles.bulletPoint}>
              • Communication sécurisée via HTTPS
            </Text>
            <Text style={styles.bulletPoint}>
              • Identifiants QR code temporaires et uniques
            </Text>
            <Text style={styles.bulletPoint}>
              • Aucun tracking externe ou publicité
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>Conservation des Données</Text>
          </View>
          <Text style={styles.sectionText}>
            Vos données sont conservées uniquement pendant la durée nécessaire au service de vestiaire. Elles sont automatiquement supprimées 7 jours après le dépôt de votre veste.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              ⚡ Suppression automatique après 7 jours
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserX size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>Vos Droits</Text>
          </View>
          <Text style={styles.sectionText}>
            Conformément au RGPD, vous disposez des droits suivants : accès, rectification, suppression, limitation du traitement, portabilité et opposition. Pour exercer ces droits, contactez-nous à privacy@myjacket.fr.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dernière mise à jour : Janvier 2025</Text>
          <Text style={styles.footerText}>MyJacket - Conforme RGPD</Text>
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
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  sectionText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoints: {
    gap: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  highlightBox: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.primary + '40',
    marginTop: 8,
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
  },
});
