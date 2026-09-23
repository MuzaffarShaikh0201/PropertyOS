import '@/global.css';

import { Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { useThemePreference } from '@/lib/theme-preference';

SplashScreen.preventAutoHideAsync();

// Matches tailwind.config.js's `bg` token — kept as a plain hex here since
// the system UI chrome (root window / status & nav bar content color)
// doesn't go through NativeWind's className pipeline.
const BG_COLOR = { light: '#F6F7F7', dark: '#14181A' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <AuthProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { colorScheme, isLoaded: isThemeLoaded } = useThemePreference();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isThemeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isThemeLoaded]);

  // Both the status bar and Android's navigation bar are edge-to-edge and
  // transparent by default — what shows through them is the root window's
  // own background, so it has to be kept in sync with the app's bg token.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(BG_COLOR[colorScheme === 'dark' ? 'dark' : 'light']);
  }, [colorScheme]);

  if (isLoading || !isThemeLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="owners/index" />
          <Stack.Screen name="owners/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="owners/[id]" />
          <Stack.Screen name="properties/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="tenants/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="tenants/[id]" />
          <Stack.Screen name="agreements/new/step1" options={{ presentation: 'modal' }} />
          <Stack.Screen name="agreements/new/step2" options={{ presentation: 'modal' }} />
          <Stack.Screen name="agreements/new/step3" options={{ presentation: 'modal' }} />
          <Stack.Screen name="agreements/[id]" />
          <Stack.Screen name="agreements/[id]/give-notice" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bills/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="legal-config" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="about" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="change-password" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Stack.Protected>
        <Stack.Screen name="terms" />
        <Stack.Screen name="privacy" />
      </Stack>
    </ThemeProvider>
  );
}
