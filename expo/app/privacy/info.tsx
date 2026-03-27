import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Shield, Lock, Clock, UserX, Mail, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTranslations } from '@/constants/translations';
import { Language } from '@/contexts/LanguageContext';

export default function PrivacyInfoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lang?: string }>();
  const language = (params.lang === 'en' ? 'en' : 'fr') as Language;
  const t = useTranslations(language);

  return (
    <View style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: t.gdpr.privacyTitle, headerShown: false }} />
      
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backIconButton,
            pressed && styles.backIconButtonPressed
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconHeader}>
          <Shield size={48} color={Colors.dark.primary} />
          <Text style={styles.title}>{t.gdpr.privacyTitle}</Text>
          <Text style={styles.subtitle}>
            {language === 'fr'
              ? 'Nous prenons la protection de vos données très au sérieux.'
              : 'We take the protection of your data very seriously.'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>{t.gdpr.dataCollection}</Text>
          </View>
          <Text style={styles.sectionText}>{t.gdpr.dataCollectionText}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>{t.gdpr.dataSecurity}</Text>
          </View>
          <Text style={styles.sectionText}>{t.gdpr.dataSecurityText}</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>
              • {language === 'fr' 
                ? 'Chiffrement AES-256 pour tous les numéros de téléphone'
                : 'AES-256 encryption for all phone numbers'}
            </Text>
            <Text style={styles.bulletPoint}>
              • {language === 'fr'
                ? 'Communication sécurisée via HTTPS'
                : 'Secure communication via HTTPS'}
            </Text>
            <Text style={styles.bulletPoint}>
              • {language === 'fr'
                ? 'Identifiants QR code temporaires et uniques'
                : 'Temporary and unique QR code identifiers'}
            </Text>
            <Text style={styles.bulletPoint}>
              • {language === 'fr'
                ? 'Aucun tracking externe ou publicité'
                : 'No external tracking or advertising'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>{t.gdpr.dataRetention}</Text>
          </View>
          <Text style={styles.sectionText}>{t.gdpr.dataRetentionText}</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              {language === 'fr'
                ? '⚡ Suppression automatique après 7 jours'
                : '⚡ Automatic deletion after 7 days'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserX size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>{t.gdpr.yourRights}</Text>
          </View>
          <Text style={styles.sectionText}>{t.gdpr.yourRightsText}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={24} color={Colors.dark.primary} />
            <Text style={styles.sectionTitle}>
              {language === 'fr' ? 'Contact' : 'Contact'}
            </Text>
          </View>
          <Text style={styles.sectionText}>
            {language === 'fr'
              ? 'Pour toute question concernant vos données personnelles ou pour exercer vos droits RGPD, contactez-nous à :'
              : 'For any questions regarding your personal data or to exercise your GDPR rights, contact us at:'}
          </Text>
          <View style={styles.contactBox}>
            <Mail size={20} color={Colors.dark.primary} />
            <Text style={styles.contactText}>
              {language === 'fr' ? 'privacy@myjacket.fr' : 'privacy@myjacket.com'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {language === 'fr'
              ? 'Dernière mise à jour : Janvier 2025'
              : 'Last updated: January 2025'}
          </Text>
          <Text style={styles.footerText}>
            MyJacket - {language === 'fr' ? 'Conforme RGPD' : 'GDPR Compliant'}
          </Text>
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
  iconHeader: {
    alignItems: 'center',
    marginBottom: 32,
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
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginTop: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
});
