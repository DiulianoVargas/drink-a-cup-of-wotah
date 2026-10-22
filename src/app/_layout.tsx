import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useWotahStore } from '@/state/store';
import { useTheme } from '@/ui/theme/useTheme';
import { bootApp, getApp } from '@/usecases/container';

import { registerSpikeListeners } from '@/dev/spikes';

SplashScreen.preventAutoHideAsync();
// Module scope: listeners must exist before iOS delivers a background response.
registerSpikeListeners();

export default function RootLayout() {
  const { colors, dark } = useTheme();
  const ready = useWotahStore((s) => s.ready);
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    bootApp().catch((e) => console.error('[boot] failed', e));
    // Every return to the foreground re-reads the day (rollover, clock/time zone changes).
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        getApp()
          .reconcile()
          .catch((e) => console.warn('[reconcile] failed', e));
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync();
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="dev/tools" options={{ headerShown: true, title: 'Dev tools' }} />
      </Stack>
    </>
  );
}
