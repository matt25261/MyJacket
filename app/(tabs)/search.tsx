import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Modal, Keyboard, KeyboardAvoidingView, Platform, PanResponder, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Search, Phone, Hash, Package, CheckCircle, Clock, ChevronDown, X } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import { Jacket } from '@/types/jacket';
import Colors from '@/constants/colors';
import { countries, Country } from '@/constants/countries';
import QRCode from 'react-native-qrcode-svg';

export default function SearchScreen() {
  const { jackets, retrieveJacket } = useJackets();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedJacket, setSelectedJacket] = useState<Jacket | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);

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

  const handleSearchChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setSearchQuery(formatted);
  };

  const filteredJackets = jackets.filter(jacket => {
    if (!searchQuery) return false;
    if (jacket.status === 'retrieved') return false;
    const fullPhone = `${selectedCountry.dialCode}${searchQuery}`;
    const jacketFullPhone = `${jacket.countryCode}${jacket.phoneNumber}`;
    return jacketFullPhone.includes(fullPhone) || jacket.phoneNumber.includes(searchQuery);
  });

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

  const handleRetrieveJacket = () => {
    if (!selectedJacket) return;
    
    Alert.alert(
      language === 'fr' ? 'Confirmer la récupération' : 'Confirm retrieval',
      language === 'fr' 
        ? `Marquer la veste n°${selectedJacket.hangerNumber} comme récupérée ?`
        : `Mark jacket #${selectedJacket.hangerNumber} as retrieved?`,
      [
        {
          text: language === 'fr' ? 'Annuler' : 'Cancel',
          style: 'cancel'
        },
        {
          text: language === 'fr' ? 'Récupérer' : 'Retrieve',
          style: 'default',
          onPress: async () => {
            setIsRetrieving(true);
            try {
              retrieveJacket(selectedJacket.id);
              Alert.alert(
                language === 'fr' ? 'Succès' : 'Success',
                language === 'fr' ? 'La veste a été marquée comme récupérée' : 'The jacket has been marked as retrieved'
              );
              setSelectedJacket(null);
            } catch (error) {
              console.error('Error retrieving jacket:', error);
              Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                language === 'fr' ? 'Une erreur est survenue' : 'An error occurred'
              );
            } finally {
              setIsRetrieving(false);
            }
          }
        }
      ]
    );
  };

  const renderJacket = ({ item }: { item: Jacket }) => (
    <Pressable
      style={({ pressed }) => [
        styles.jacketCard,
        pressed && styles.jacketCardPressed
      ]}
      onPress={() => setSelectedJacket(item)}
    >
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
            {item.status === 'active' ? t.list.active : t.list.retrieved}
          </Text>
        </View>
        <Text style={styles.hangerNumberBadge}>{item.hangerNumber}</Text>
      </View>

      <View style={styles.jacketInfo}>
        <View style={styles.infoRow}>
          <Phone size={18} color={Colors.dark.textSecondary} />
          <Text style={styles.infoText}>{item.countryCode} {item.phoneNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={18} color={Colors.dark.textSecondary} />
          <Text style={styles.infoText}>
            {language === 'fr' ? 'Déposée' : 'Deposited'} {formatDate(item.depositTime)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      {...panResponder.panHandlers}
    >
      <Stack.Screen options={{ title: t.search.title }} />
      
      <View style={styles.searchSection}>
        <Text style={styles.searchTitle}>{language === 'fr' ? 'Rechercher par téléphone' : 'Search by phone'}</Text>
        <Text style={styles.searchSubtitle}>
          {language === 'fr' ? 'Retrouvez une veste en cas de perte de ticket' : 'Find a jacket if the ticket is lost'}
        </Text>

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
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.dark.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={language === 'fr' ? 'Entrez le numéro...' : 'Enter the number...'}
              placeholderTextColor={Colors.dark.textTertiary}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={20} color={Colors.dark.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {searchQuery.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Search size={64} color={Colors.dark.textTertiary} />
          <Text style={styles.emptyTitle}>{language === 'fr' ? 'Rechercher une veste' : 'Search for a jacket'}</Text>
          <Text style={styles.emptyText}>
            {language === 'fr' ? 'Entrez un numéro de téléphone pour retrouver les vestes associées' : 'Enter a phone number to find associated jackets'}
          </Text>
        </View>
      ) : filteredJackets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color={Colors.dark.textTertiary} />
          <Text style={styles.emptyTitle}>{t.common.noResults}</Text>
          <Text style={styles.emptyText}>
            {t.search.noResults}
          </Text>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {filteredJackets.length} {language === 'fr' ? `résultat${filteredJackets.length > 1 ? 's' : ''} trouvé${filteredJackets.length > 1 ? 's' : ''}` : `result${filteredJackets.length > 1 ? 's' : ''} found`}
          </Text>
          <FlatList
            data={filteredJackets}
            renderItem={renderJacket}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {isKeyboardVisible && (
        <View style={styles.keyboardToolbar}>
          <Pressable
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed
            ]}
            onPress={() => Keyboard.dismiss()}
          >
            <Text style={styles.dismissButtonText}>{language === 'fr' ? 'Terminé' : 'Done'}</Text>
          </Pressable>
        </View>
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

            <View style={styles.countrySearchContainer}>
              <Search size={20} color={Colors.dark.textSecondary} />
              <TextInput
                style={styles.countrySearchInput}
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
        visible={selectedJacket !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedJacket(null)}
      >
        <View style={styles.detailModalOverlay}>
          <Pressable 
            style={styles.detailModalBackdrop}
            onPress={() => setSelectedJacket(null)}
          />
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>{language === 'fr' ? 'Détails de la veste' : 'Jacket details'}</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setSelectedJacket(null)}
              >
                <X size={24} color={Colors.dark.text} />
              </Pressable>
            </View>

            {selectedJacket && (
              <View style={styles.detailContent}>
                <View style={styles.qrContainer}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={selectedJacket.qrCode}
                      size={200}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>
                  <Text style={styles.qrCode}>{selectedJacket.qrCode}</Text>
                </View>

                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Hash size={20} color={Colors.dark.textSecondary} />
                    <Text style={styles.detailLabel}>{language === 'fr' ? 'Cintre' : 'Hanger'}</Text>
                    <Text style={styles.detailValue}>{selectedJacket.hangerNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={20} color={Colors.dark.textSecondary} />
                    <Text style={styles.detailLabel}>{t.deposit.ownerPhone}</Text>
                    <Text style={styles.detailValue}>
                      {selectedJacket.countryCode} {selectedJacket.phoneNumber}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={20} color={Colors.dark.textSecondary} />
                    <Text style={styles.detailLabel}>{language === 'fr' ? 'Dépôt' : 'Deposit'}</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedJacket.depositTime)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    {selectedJacket.status === 'active' ? (
                      <Package size={20} color={Colors.dark.primary} />
                    ) : (
                      <CheckCircle size={20} color={Colors.dark.success} />
                    )}
                    <Text style={styles.detailLabel}>{language === 'fr' ? 'Statut' : 'Status'}</Text>
                    <Text style={[
                      styles.detailValue,
                      selectedJacket.status === 'active' 
                        ? styles.detailValueActive 
                        : styles.detailValueRetrieved
                    ]}>
                      {selectedJacket.status === 'active' ? t.list.active : t.list.retrieved}
                    </Text>
                  </View>
                  {selectedJacket.retrievalTime && (
                    <View style={styles.detailRow}>
                      <CheckCircle size={20} color={Colors.dark.success} />
                      <Text style={styles.detailLabel}>{language === 'fr' ? 'Récupération' : 'Retrieval'}</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedJacket.retrievalTime)}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedJacket.status === 'active' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.retrieveButton,
                      pressed && styles.retrieveButtonPressed,
                      isRetrieving && styles.retrieveButtonDisabled
                    ]}
                    onPress={handleRetrieveJacket}
                    disabled={isRetrieving}
                  >
                    <CheckCircle size={20} color="white" />
                    <Text style={styles.retrieveButtonText}>
                      {isRetrieving 
                        ? (language === 'fr' ? 'En cours...' : 'Processing...') 
                        : (language === 'fr' ? 'Marquer comme récupérée' : 'Mark as retrieved')}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
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
  searchSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 20,
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.dark.text,
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
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
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
  jacketCardPressed: {
    backgroundColor: Colors.dark.cardHover,
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
  countrySearchContainer: {
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
  countrySearchInput: {
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
  detailModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  detailModalContent: {
    backgroundColor: Colors.dark.background,
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  detailContent: {
    padding: 20,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  qrCode: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontFamily: 'monospace' as const,
  },
  detailCard: {
    width: '100%',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  detailValueActive: {
    color: Colors.dark.primary,
  },
  detailValueRetrieved: {
    color: Colors.dark.success,
  },
  keyboardToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.card,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.dark.primary,
  },
  dismissButtonPressed: {
    backgroundColor: Colors.dark.primaryDark,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  retrieveButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.success,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  retrieveButtonPressed: {
    backgroundColor: Colors.dark.success + 'CC',
  },
  retrieveButtonDisabled: {
    backgroundColor: Colors.dark.success + '66',
  },
  retrieveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});
