import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { ScanLine, CheckCircle, XCircle, Camera } from 'lucide-react-native';
import { useJackets } from '@/contexts/JacketContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';
import Colors from '@/constants/colors';

export default function ScannerScreen() {
  const { getJacketByQR, retrieveJacket } = useJackets();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const [facing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; hangerNumber?: string } | null>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t.scanner.title }} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t.scanner.title }} />
        <View style={styles.centerContainer}>
          <Camera size={64} color={Colors.dark.textSecondary} />
          <Text style={styles.permissionTitle}>{t.scanner.permission}</Text>
          <Text style={styles.permissionText}>
            {language === 'fr' ? 'Nous avons besoin de votre permission pour scanner les QR codes' : 'We need your permission to scan QR codes'}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && styles.permissionButtonPressed
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>{t.scanner.grantPermission}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    console.log('QR Code scanned:', data);

    let qrCode = data;
    if (data.includes('/pickup/')) {
      const parts = data.split('/pickup/');
      qrCode = parts[parts.length - 1];
    }

    console.log('Extracted QR code:', qrCode);

    const jacket = getJacketByQR(qrCode);

    if (!jacket) {
      setScanResult({
        success: false,
        message: language === 'fr' ? 'QR code invalide ou veste non trouvée' : 'Invalid QR code or jacket not found',
      });
      return;
    }

    if (jacket.status === 'retrieved') {
      setScanResult({
        success: false,
        message: t.pickup.alreadyRetrieved,
        hangerNumber: jacket.hangerNumber,
      });
      return;
    }

    retrieveJacket(jacket.id);
    setScanResult({
      success: true,
      message: t.pickup.success,
      hangerNumber: jacket.hangerNumber,
    });
  };

  const handleReset = () => {
    setScanned(false);
    setScanResult(null);
  };

  const handleViewList = () => {
    router.push('/list' as any);
  };

  if (scanResult) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: language === 'fr' ? 'Résultat du scan' : 'Scan result' }} />
        <View style={styles.resultContainer}>
          <View style={styles.resultIcon}>
            {scanResult.success ? (
              <CheckCircle size={80} color={Colors.dark.success} />
            ) : (
              <XCircle size={80} color={Colors.dark.error} />
            )}
          </View>

          <Text style={[
            styles.resultTitle,
            { color: scanResult.success ? Colors.dark.success : Colors.dark.error }
          ]}>
            {scanResult.success ? (language === 'fr' ? 'Succès !' : 'Success!') : (language === 'fr' ? 'Erreur' : 'Error')}
          </Text>

          <Text style={styles.resultMessage}>{scanResult.message}</Text>

          {scanResult.hangerNumber && (
            <View style={styles.hangerCard}>
              <Text style={styles.hangerLabel}>{language === 'fr' ? 'Numéro de cintre' : 'Hanger number'}</Text>
              <Text style={styles.hangerNumber}>{scanResult.hangerNumber}</Text>
            </View>
          )}

          <View style={styles.resultActions}>
            <Pressable
              style={({ pressed }) => [
                styles.resultButton,
                styles.resultButtonPrimary,
                pressed && styles.resultButtonPressed
              ]}
              onPress={handleReset}
            >
              <ScanLine size={20} color={Colors.dark.text} />
              <Text style={styles.resultButtonText}>{language === 'fr' ? 'Scanner à nouveau' : 'Scan again'}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resultButton,
                pressed && styles.resultButtonPressed
              ]}
              onPress={handleViewList}
            >
              <Text style={styles.resultButtonTextSecondary}>{language === 'fr' ? 'Voir la liste' : 'View list'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t.scanner.title }} />
      
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.instructions}>
        <ScanLine size={24} color={Colors.dark.primary} />
        <Text style={styles.instructionsTitle}>{language === 'fr' ? 'Scannez le QR code' : 'Scan the QR code'}</Text>
        <Text style={styles.instructionsText}>
          {language === 'fr' ? 'Positionnez le QR code dans le cadre pour récupérer la veste' : 'Position the QR code in the frame to retrieve the jacket'}
        </Text>
      </View>
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
    padding: 20,
    gap: 16,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  permissionButtonPressed: {
    backgroundColor: Colors.dark.primaryDark,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.dark.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructions: {
    backgroundColor: Colors.dark.card,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultIcon: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  resultMessage: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  hangerCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    marginBottom: 32,
    minWidth: 200,
  },
  hangerLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  hangerNumber: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  resultActions: {
    width: '100%',
    gap: 12,
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  resultButtonPrimary: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  resultButtonPressed: {
    opacity: 0.8,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  resultButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
});
