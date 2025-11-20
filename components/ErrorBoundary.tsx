import { Component, ErrorInfo, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary captured error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary stack info:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      console.log('Reload the app from the Expo client to recover.');
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container} testID="error-boundary">
        <Text style={styles.title}>Quelque chose s’est mal passé</Text>
        <Text style={styles.message}>
          {this.state.error?.message ?? "Une erreur inattendue s’est produite."}
        </Text>
        <Pressable style={styles.button} onPress={this.handleReset} testID="error-boundary-reset">
          <Text style={styles.buttonText}>Relancer</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
  },
  buttonText: {
    color: '#0b0b0b',
    fontSize: 16,
    fontWeight: '600',
  },
});
