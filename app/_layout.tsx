import '../src/core/utils/scale';
import '@/core/utils/cryptoPolyfill';

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/store/themeStore';
import { AppLockGate } from '@/shared/components/AppLockGate';
import { BannerHost } from '@/shared/components/BannerHost';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { PrintDialogHost } from '@/shared/components/PrintDialogHost';
import { usePrinterStore } from '@/store/printerStore';
import { androidChannelSetup } from '@/features/notifications/notificationService';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AuthGate(): null {
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [initialized, isAuthenticated, segments, router]);

  return null;
}

export default function RootLayout(): React.ReactElement {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const initializePrinter = usePrinterStore((s) => s.initialize);
  const { isDark } = useTheme();

  useEffect(() => {
    androidChannelSetup();
    void initialize();
    void initializePrinter();
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
  }, [initialize, initializePrinter]);

  useEffect(() => {
    if (initialized) void SplashScreen.hideAsync().catch(() => undefined);
  }, [initialized]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppLockGate>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <AuthGate />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: isDark ? '#121212' : '#F2F6FA' },
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="kasir" options={{ animation: 'fade' }} />
              <Stack.Screen name="payment" />
              <Stack.Screen name="form-produk" />
              <Stack.Screen name="form-listrik" />
              <Stack.Screen name="form-pulsa" />
              <Stack.Screen name="trx-detail" />
              <Stack.Screen name="hutang" />
              <Stack.Screen name="keuangan" />
              <Stack.Screen name="backup-restore" />
              <Stack.Screen name="account-settings" />
              <Stack.Screen name="invoice-setup" />
              <Stack.Screen name="invoice-list" />
              <Stack.Screen name="invoice-editor" />
              <Stack.Screen name="printer" />
              <Stack.Screen name="logo-setup" />
              <Stack.Screen name="notifikasi-pengaturan" />
              <Stack.Screen name="+not-found" options={{ animation: 'fade' }} />
            </Stack>
            <BannerHost />
            <PrintDialogHost />
          </AppLockGate>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
