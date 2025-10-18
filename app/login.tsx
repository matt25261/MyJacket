import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/constants/translations';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(language === 'fr' ? 'Erreur' : 'Error', language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(language === 'fr' ? 'Erreur' : 'Error', t.auth.invalidCredentials);
    }
  };

  if (authLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <View style={styles.logoContainer}>
          <LogIn size={64} color={Colors.dark.tint} />
          <Text style={styles.title}>MyJacket</Text>
          <Text style={styles.subtitle}>{language === 'fr' ? 'Gestion de vestiaire' : 'Cloakroom management'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.auth.username}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={language === 'fr' ? "Entrez votre nom d'utilisateur" : 'Enter your username'}
              placeholderTextColor={Colors.dark.tabIconDefault}
              autoCapitalize="none"
              editable={!isLoading}
              testID="username-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.auth.password}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={language === 'fr' ? 'Entrez votre mot de passe' : 'Enter your password'}
              placeholderTextColor={Colors.dark.tabIconDefault}
              secureTextEntry
              editable={!isLoading}
              testID="password-input"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            testID="login-button"
          >
            <Text style={styles.buttonText}>
              {isLoading ? (language === 'fr' ? 'Connexion...' : 'Logging in...') : t.auth.loginButton}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.tabIconDefault,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  button: {
    backgroundColor: Colors.dark.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
