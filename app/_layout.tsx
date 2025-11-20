import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { JacketProvider } from "@/contexts/JacketContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, hasCheckedAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hasCheckedAuth) return;

    const inAuthGroup = segments[0] === 'login';
    const isPublicRoute = segments[0] === 'privacy-policy' || segments[0] === 'pickup';

    if (!isAuthenticated && !inAuthGroup && !isPublicRoute) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, hasCheckedAuth, router]);

  if (!hasCheckedAuth) {
    return null;
  }

  return (
    <Stack 
      screenOptions={{ headerBackTitle: "Retour" }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pickup/[id]" options={{ title: "Récupération" }} />
      <Stack.Screen name="pickup/qr/[id]" options={{ title: "Mon QR Code", headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Protection des Données", headerShown: false, presentation: "card" }} />
      <Stack.Screen name="active-jackets" options={{ title: "Vestes Actives" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors.dark.background);
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <JacketProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ErrorBoundary>
                  <RootLayoutNav />
                </ErrorBoundary>
              </GestureHandlerRootView>
            </JacketProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
