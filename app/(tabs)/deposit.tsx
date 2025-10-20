import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform, Modal, FlatList, Keyboard, KeyboardAvoidingView, PanResponder, Share, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Package, Phone, Hash, CheckCircle, ChevronDown, Search, X, Share2, MessageCircle, Copy, AlertCircle } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useJackets } from '@/contexts/JacketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import Colors from '@/constants/colors';
import { countries, Country } from '@/constants/countries';

export default function DepositScreen() {
  const { addJacket } = useJackets();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hangerNumber, setHangerNumber] = useState('');
  const { jackets } = useJackets();
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [pendingJacket, setPendingJacket] = useState<any>(null);
  const qrRef = useRef<any>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 20 && isKeyboardVisible) {
        Keyboard.dismiss();
      }
    },
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const formatHangerNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleHangerChange = (text: string) => {
    const formatted = formatHangerNumber(text);
    setHangerNumber(formatted);
  };

  const validateInputs = () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      Alert.alert(t.deposit.error, 'Veuillez entrer un numéro de téléphone valide');
      return false;
    }
    if (!hangerNumber || hangerNumber.trim().length === 0) {
      Alert.alert(t.deposit.error, 'Veuillez entrer un numéro de cintre');
      return false;
    }
    
    const existingJacket = jackets.find(j => 
      j.hangerNumber === hangerNumber.trim() && j.status === 'active'
    );
    if (existingJacket) {
      Alert.alert(t.deposit.error, `Le numéro de cintre ${hangerNumber} est déjà utilisé par une veste active`);
      return false;
    }
    
    return true;
  };

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.dialCode.includes(countrySearch) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setCountrySearch('');
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setIsSubmitting(true);

    const qrCode = `MYJACKET-${Date.now()}-${hangerNumber}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=400x400&format=png`;

    const jacket = {
      id: Date.now().toString(),
      hangerNumber: hangerNumber.trim(),
      phoneNumber,
      countryCode: selectedCountry.dialCode,
      qrCode: qrCode,
      deepLink: qrImageUrl,
      status: 'active' as const,
      depositTime: new Date().toISOString(),
    };

    const fullPhoneNumber = `${jacket.countryCode}${jacket.phoneNumber}`;
    const message = `🎟️ MyJacket - Votre QR code de récupération\n\nCintre n°${jacket.hangerNumber}\n\nVoici votre QR code :\n${jacket.deepLink}\n\nPrésentez ce code au vestiaire pour récupérer votre veste.`;
    
    try {
      if (Platform.OS === 'web') {
        Alert.alert(t.common.close, 'L\'envoi de SMS n\'est pas disponible sur le web.');
        setIsSubmitting(false);
        return;
      }

      const separator = Platform.OS === 'ios' ? '&' : '?';
      const smsUrl = `sms:${fullPhoneNumber}${separator}body=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        setPendingJacket(jacket);
        setShowVerification(true);
      } else {
        Alert.alert(t.deposit.error, 'Impossible d\'ouvrir l\'application SMS');
      }
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert(t.deposit.error, 'Impossible d\'ouvrir l\'application SMS');
    }

    setIsSubmitting(false);
  };

  const handleNewDeposit = () => {
    setPhoneNumber('');
    setHangerNumber('');
    setGeneratedQR(null);
    setSelectedCountry(countries[0]);
    setPendingJacket(null);
    setShowVerification(false);
  };

  const handleConfirmDelivery = () => {
    if (!pendingJacket) return;

    addJacket(pendingJacket);
    setGeneratedQR(pendingJacket.qrCode);
    setPhoneNumber(pendingJacket.phoneNumber);
    setHangerNumber(pendingJacket.hangerNumber);
    setShowVerification(false);
  };

  const handleCancelDeposit = () => {
    const currentHangerNumber = pendingJacket?.hangerNumber || hangerNumber;
    setShowVerification(false);
    setPendingJacket(null);
    
    setTimeout(() => {
      Alert.alert(
        '❌ Dépôt annulé', 
        `Le dépôt a été annulé.\n\nLe cintre n°${currentHangerNumber} est à nouveau disponible.`,
        [
          { 
            text: 'OK', 
            onPress: handleNewDeposit,
            style: 'default'
          }
        ]
      );
    }, 300);
  };

  const handleShare = async () => {
    if (!generatedQR) return;
    
    const jacket = jackets.find(j => j.qrCode === generatedQR);
    if (!jacket) return;

    const message = `🎟️ MyJacket - Votre QR code de récupération\n\nCintre n°${jacket.hangerNumber}\n\nVoici votre QR code :\n${jacket.deepLink}\n\nPrésentez ce code au vestiaire pour récupérer votre veste.`;

    try {
      await Share.share({
        message,
        title: 'Lien de récupération - MyJacket',
        url: jacket.deepLink,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSendSMS = async () => {
    if (!generatedQR) return;
    
    const jacket = jackets.find(j => j.qrCode === generatedQR);
    if (!jacket) return;

    const fullPhoneNumber = `${jacket.countryCode}${jacket.phoneNumber}`;
    const message = `🎟️ MyJacket - Votre QR code de récupération\n\nCintre n°${jacket.hangerNumber}\n\nVoici votre QR code :\n${jacket.deepLink}\n\nPrésentez ce code au vestiaire pour récupérer votre veste.`;
    
    try {
      if (Platform.OS === 'web') {
        Alert.alert(t.common.close, 'L\'envoi de SMS n\'est pas disponible sur le web. Utilisez "Partager" ou "Copier lien".');
        return;
      }

      const separator = Platform.OS === 'ios' ? '&' : '?';
      const smsUrl = `sms:${fullPhoneNumber}${separator}body=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        setPendingJacket(jacket);
        setShowVerification(true);
      } else {
        Alert.alert(t.deposit.error, 'Impossible d\'ouvrir l\'application SMS');
      }
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert(t.deposit.error, 'Impossible d\'ouvrir l\'application SMS');
    }
  };

  const handleCopyLink = async () => {
    if (!generatedQR) return;
    
    const jacket = jackets.find(j => j.qrCode === generatedQR);
    if (!jacket || !jacket.deepLink) return;

    try {
      await Clipboard.setStringAsync(jacket.deepLink);
      Alert.alert(language === 'fr' ? 'Copié !' : 'Copied!', language === 'fr' ? 'Le lien a été copié dans le presse-papier' : 'The link has been copied to the clipboard');
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert(t.deposit.error, language === 'fr' ? 'Impossible de copier le lien' : 'Unable to copy the link');
    }
  };

  if (generatedQR) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t.deposit.success }} />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color={Colors.dark.success} />
            </View>
            
            <Text style={styles.successTitle}>{language === 'fr' ? 'Cintre enregistré !' : 'Hanger registered!'}</Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={jackets.find(j => j.qrCode === generatedQR)?.deepLink || `myapp://pickup/qr/${generatedQR}`}
                  size={240}
                  backgroundColor="white"
                  color="black"
                  getRef={(ref) => (qrRef.current = ref)}
                />
              </View>
              <Text style={styles.qrCode}>{generatedQR}</Text>
              <Text style={styles.qrHint}>{language === 'fr' ? 'Scannez ce code pour récupérer la veste' : 'Scan this code to retrieve the jacket'}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Phone size={20} color={Colors.dark.textSecondary} />
                <Text style={styles.infoLabel}>{t.deposit.ownerPhone}</Text>
                <Text style={styles.infoValue}>{selectedCountry.dialCode} {phoneNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Hash size={20} color={Colors.dark.textSecondary} />
                <Text style={styles.infoLabel}>{language === 'fr' ? 'Cintre' : 'Hanger'}</Text>
                <Text style={styles.infoValue}>{hangerNumber}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryActionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={handleSendSMS}
              >
                <MessageCircle size={20} color={Colors.dark.text} />
                <Text style={styles.actionButtonText}>{language === 'fr' ? 'Envoyer SMS' : 'Send SMS'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.secondaryActionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={handleShare}
              >
                <Share2 size={20} color={Colors.dark.text} />
                <Text style={styles.actionButtonText}>{language === 'fr' ? 'Partager' : 'Share'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.secondaryActionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={handleCopyLink}
              >
                <Copy size={20} color={Colors.dark.text} />
                <Text style={styles.actionButtonText}>{language === 'fr' ? 'Copier lien' : 'Copy link'}</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.newDepositButton,
                pressed && styles.newDepositButtonPressed
              ]}
              onPress={handleNewDeposit}
            >
              <Package size={20} color={Colors.dark.text} />
              <Text style={styles.newDepositButtonText}>{t.dashboard.newDeposit}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: t.deposit.newJacket }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{language === 'fr' ? 'Enregistrer une veste' : 'Register a jacket'}</Text>
          <Text style={styles.subtitle}>{language === 'fr' ? 'Saisissez les informations du client' : 'Enter customer information'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.deposit.ownerPhone}</Text>
            <View style={styles.phoneInputRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.countrySelector,
                  pressed && styles.countrySelectorPressed
                ]}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
                <ChevronDown size={16} color={Colors.dark.textSecondary} />
              </Pressable>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="612345678"
                  placeholderTextColor={Colors.dark.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.deposit.jacketNumber}</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color={Colors.dark.textSecondary} />
              <TextInput
                style={styles.input}
                value={hangerNumber}
                onChangeText={handleHangerChange}
                placeholder="123"
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Package size={20} color={Colors.dark.text} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? (language === 'fr' ? 'Enregistrement...' : 'Registering...') : t.deposit.submit}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>ℹ️ {language === 'fr' ? 'Information' : 'Information'}</Text>
          <Text style={styles.infoBoxText}>
            {language === 'fr' 
              ? 'Un QR code unique sera généré. Vous pourrez l\'envoyer directement au client via SMS ou messagerie. Il pourra le présenter pour récupérer sa veste.'
              : 'A unique QR code will be generated. You can send it directly to the customer via SMS or messaging. They can present it to retrieve their jacket.'}
          </Text>
        </View>
      </ScrollView>

      {isKeyboardVisible && (
        <Pressable
          style={styles.keyboardToolbar}
          onPress={() => Keyboard.dismiss()}
        >
          <View style={styles.dismissHandle} />
        </Pressable>
      )}

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.deposit.selectCountry}</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCountryPicker(false);
                  setCountrySearch('');
                }}
              >
                <X size={24} color={Colors.dark.text} />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.dark.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder={language === 'fr' ? 'Rechercher un pays...' : 'Search a country...'}
                placeholderTextColor={Colors.dark.textTertiary}
              />
              {countrySearch.length > 0 && (
                <Pressable onPress={() => setCountrySearch('')}>
                  <X size={20} color={Colors.dark.textSecondary} />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.countryItem,
                    pressed && styles.countryItemPressed,
                    item.code === selectedCountry.code && styles.countryItemSelected
                  ]}
                  onPress={() => selectCountry(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemDialCode}>{item.dialCode}</Text>
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVerification}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.verificationOverlay}>
          <View style={styles.verificationContent}>
            <View style={styles.verificationIcon}>
              <AlertCircle size={48} color={Colors.dark.warning} />
            </View>
            
            <Text style={styles.verificationTitle}>{language === 'fr' ? 'Vérification' : 'Verification'}</Text>
            <Text style={styles.verificationMessage}>
              {language === 'fr' ? 'Le client a-t-il bien reçu le message ?' : 'Did the customer receive the message?'}
            </Text>

            <View style={styles.verificationButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.verificationButton,
                  styles.confirmButton,
                  pressed && styles.verificationButtonPressed
                ]}
                onPress={handleConfirmDelivery}
              >
                <CheckCircle size={20} color="white" />
                <Text style={styles.confirmButtonText}>{language === 'fr' ? 'Message reçu' : 'Message received'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.verificationButton,
                  styles.cancelButton,
                  pressed && styles.verificationButtonPressed
                ]}
                onPress={handleCancelDeposit}
              >
                <X size={20} color="white" />
                <Text style={styles.cancelButtonText}>{language === 'fr' ? 'Annuler le dépôt' : 'Cancel deposit'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    marginBottom: 32,
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
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.dark.text,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 12,
    gap: 6,
    minWidth: 110,
  },
  countrySelectorPressed: {
    backgroundColor: Colors.dark.cardHover,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryDialCode: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.dark.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    margin: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.dark.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  countryItemPressed: {
    backgroundColor: Colors.dark.card,
  },
  countryItemSelected: {
    backgroundColor: Colors.dark.primary + '20',
  },
  countryItemFlag: {
    fontSize: 28,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
  },
  countryItemDialCode: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonPressed: {
    backgroundColor: Colors.dark.primaryDark,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  infoBox: {
    backgroundColor: Colors.dark.secondary + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.secondary + '30',
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrCode: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontFamily: 'monospace' as const,
  },
  qrHint: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  newDepositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  newDepositButtonPressed: {
    backgroundColor: Colors.dark.cardHover,
  },
  newDepositButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: Colors.dark.primary,
  },
  secondaryActionButton: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  keyboardToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissHandle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.dark.text,
    borderRadius: 2.5,
    opacity: 0.3,
  },
  verificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verificationContent: {
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  verificationIcon: {
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationMessage: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  verificationButtons: {
    width: '100%',
    gap: 12,
  },
  verificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  verificationButtonPressed: {
    opacity: 0.8,
  },
  confirmButton: {
    backgroundColor: Colors.dark.success,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  cancelButton: {
    backgroundColor: Colors.dark.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});

