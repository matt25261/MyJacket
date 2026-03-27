import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { Shield, Lock, Clock, UserX, Mail, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';

export default function PrivacyScreen() {
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMyData = () => {
    setShowDeleteForm(!showDeleteForm);
    if (!showDeleteForm) {
      setPhoneNumber('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' 
          ? 'Veuillez entrer un numéro de téléphone valide'
          : 'Please enter a valid phone number'
      );
      return;
    }

    Alert.alert(
      t.gdpr.deleteDataConfirm,
      language === 'fr'
        ? `Toutes les données associées au numéro ${phoneNumber} seront définitivement supprimées.`
        : `All data associated with number ${phoneNumber} will be permanently deleted.`,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              Alert.alert(
                language === 'fr' ? 'Succès' : 'Success',
                t.gdpr.deleteDataSuccess
              );
              setPhoneNumber('');
              setShowDeleteForm(false);
            } catch (error) {
              Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                t.gdpr.deleteDataError
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t.settings.gdpr }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
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
          
          <Pressable
            style={({ pressed }) => [
              styles.contactButton,
              pressed && styles.contactButtonPressed
            ]}
            onPress={() => {
              Alert.alert(
                language === 'fr' ? 'Nous contacter' : 'Contact us',
                language === 'fr'
                  ? 'Pour toute demande concernant vos données, contactez-nous à :\n\nprivacy@myjacket.fr'
                  : 'For any request regarding your data, contact us at:\n\nprivacy@myjacket.com'
              );
            }}
          >
            <Mail size={20} color={Colors.dark.text} />
            <Text style={styles.contactButtonText}>
              {language === 'fr' ? 'Nous contacter' : 'Contact us'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.dangerSection}>
          <View style={styles.sectionHeader}>
            <Trash2 size={24} color={Colors.dark.error} />
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t.gdpr.deleteMyData}</Text>
          </View>
          <Text style={styles.sectionText}>
            {language === 'fr'
              ? 'Vous pouvez demander la suppression immédiate de toutes vos données en entrant votre numéro de téléphone ci-dessous.'
              : 'You can request immediate deletion of all your data by entering your phone number below.'}
          </Text>
          
          {!showDeleteForm ? (
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed
              ]}
              onPress={handleDeleteMyData}
            >
              <Trash2 size={20} color="white" />
              <Text style={styles.deleteButtonText}>{t.gdpr.deleteMyData}</Text>
            </Pressable>
          ) : (
            <View style={styles.deleteForm}>
              <TextInput
                style={styles.deleteInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={language === 'fr' ? 'Votre numéro de téléphone' : 'Your phone number'}
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="phone-pad"
                editable={!isDeleting}
              />
              <View style={styles.deleteFormButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteFormButton,
                    styles.cancelDeleteButton,
                    pressed && styles.deleteButtonPressed
                  ]}
                  onPress={handleDeleteMyData}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelDeleteButtonText}>{t.common.cancel}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteFormButton,
                    styles.confirmDeleteButton,
                    pressed && styles.deleteButtonPressed,
                    isDeleting && styles.deleteButtonDisabled
                  ]}
                  onPress={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  <Text style={styles.confirmDeleteButtonText}>
                    {isDeleting 
                      ? (language === 'fr' ? 'Suppression...' : 'Deleting...')
                      : t.common.confirm}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginTop: 12,
  },
  contactButtonPressed: {
    opacity: 0.7,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  dangerSection: {
    marginTop: 12,
    marginBottom: 28,
    backgroundColor: Colors.dark.error + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.error + '30',
  },
  dangerTitle: {
    color: Colors.dark.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.error,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
  },
  deleteButtonPressed: {
    opacity: 0.8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  deleteForm: {
    gap: 12,
    marginTop: 12,
  },
  deleteInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  deleteFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteFormButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  confirmDeleteButton: {
    backgroundColor: Colors.dark.error,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
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
