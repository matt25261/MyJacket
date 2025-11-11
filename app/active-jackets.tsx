import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Package, Phone, Calendar, ChevronLeft, MessageCircle } from 'lucide-react-native';
import { useActiveJackets } from '@/contexts/JacketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import Colors from '@/constants/colors';

export default function ActiveJacketsScreen() {
  const activeJackets = useActiveJackets();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const router = useRouter();

  const handleCall = (phoneNumber: string, countryCode: string) => {
    Alert.alert(
      language === 'fr' ? 'Appeler le propriétaire' : 'Call owner',
      `${countryCode}${phoneNumber}`,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: language === 'fr' ? 'Appeler' : 'Call',
          onPress: () => {
            Linking.openURL(`tel:${countryCode}${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleMessage = (phoneNumber: string, countryCode: string) => {
    const message = language === 'fr'
      ? 'Bonjour, vous avez oublié votre veste dans notre établissement. Merci de venir la récupérer dès que possible.'
      : 'Hello, you forgot your jacket at our establishment. Please come and pick it up as soon as possible.';
    
    const fullNumber = `${countryCode}${phoneNumber}`;
    const smsUrl = `sms:${fullNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
    
    Linking.openURL(smsUrl);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: language === 'fr' ? 'Vestes actives' : 'Active jackets',
          headerShown: false,
        }} 
      />
      
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <ChevronLeft size={24} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {language === 'fr' ? 'Vestes actives' : 'Active jackets'}
          </Text>
          <Text style={styles.subtitle}>
            {activeJackets.length} {language === 'fr' ? 'veste(s) en attente' : 'jacket(s) waiting'}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeJackets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>
              {language === 'fr' ? 'Aucune veste active' : 'No active jackets'}
            </Text>
            <Text style={styles.emptySubtext}>
              {language === 'fr' 
                ? 'Toutes les vestes ont été récupérées' 
                : 'All jackets have been retrieved'}
            </Text>
          </View>
        ) : (
          activeJackets.map((jacket) => (
            <View key={jacket.id} style={styles.jacketCard}>
              <View style={styles.cardHeader}>
                <View style={styles.jacketIconContainer}>
                  <Package size={24} color={Colors.dark.primary} />
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.jacketNumber}>
                    {language === 'fr' ? 'Veste' : 'Jacket'} #{jacket.hangerNumber}
                  </Text>
                  <View style={styles.dateRow}>
                    <Calendar size={14} color={Colors.dark.textSecondary} />
                    <Text style={styles.dateText}>{formatDate(jacket.depositTime)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {language === 'fr' ? 'Téléphone' : 'Phone'}
                  </Text>
                  <View style={styles.phoneContainer}>
                    <Text style={styles.infoValue}>
                      {jacket.countryCode} {jacket.phoneNumber}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={({ pressed }) => [
                      styles.callButton,
                      pressed && styles.callButtonPressed
                    ]}
                    onPress={() => handleCall(jacket.phoneNumber, jacket.countryCode)}
                  >
                    <Phone size={18} color="#fff" />
                    <Text style={styles.callButtonText}>
                      {language === 'fr' ? 'Appeler' : 'Call'}
                    </Text>
                  </Pressable>

                  <Pressable 
                    style={({ pressed }) => [
                      styles.messageButton,
                      pressed && styles.messageButtonPressed
                    ]}
                    onPress={() => handleMessage(jacket.phoneNumber, jacket.countryCode)}
                  >
                    <MessageCircle size={18} color="#fff" />
                    <Text style={styles.messageButtonText}>
                      {language === 'fr' ? 'Message' : 'Message'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
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
    paddingTop: 60,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backButtonPressed: {
    backgroundColor: Colors.dark.cardHover,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  jacketCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jacketIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  jacketNumber: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 16,
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600' as const,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  callButtonPressed: {
    opacity: 0.8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  messageButtonPressed: {
    opacity: 0.8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
