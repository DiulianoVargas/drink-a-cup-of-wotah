import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { registerSpikeListeners } from '@/dev/spikes';
import { useWotahStore } from '@/state/store';
import { AnimatedSplash } from '@/ui/components/AnimatedSplash';
import { useTheme } from '@/ui/theme/useTheme';
import { bootApp, listenToSystemEvents, onForeground } from '@/usecases/container';

// AnimatedSplash hides the OS splash once its first frame matches it (contracts/splash.md).
SplashScreen.preventAutoHideAsync();
// Module scope: listeners must exist before iOS delivers a background response (research R4).
listenToSystemEvents();
registerSpikeListeners();

export default function RootLayout() {
  const { colors, dark } = useTheme();
  const ready = useWotahStore((s) => s.ready);
  const onboarded = useWotahStore((s) => s.profile?.onboardingCompleted ?? false);
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const appState = useRef(AppState.currentState);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    bootApp().catch((e) => console.error('[boot] failed', e));
    // Every return to the foreground re-reads the day (rollover, clock/time zone changes).
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current?.match(/inactive|background/) && next === 'active') {
        onForeground().catch((e) => console.warn('[reconcile] failed', e));
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // The OS splash stays up until fonts load (the wordmark uses Fredoka); boot continues behind
  // the animated splash, which fades out onto the already-mounted first screen (FR-035).
  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {ready && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          {/* FR-008: onboarding until the profile is complete, then the app. */}
          <Stack.Protected guard={onboarded} redirectTo="/weight">
            <Stack.Screen name="(main)" />
          </Stack.Protected>
          <Stack.Protected guard={!onboarded} redirectTo="/">
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Screen
            name="dev/tools"
            options={{ headerShown: true, headerTransparent: false, title: 'Dev tools' }}
          />
        </Stack>
      )}
      {!splashDone && <AnimatedSplash ready={ready} onDone={() => setSplashDone(true)} />}
    </>
  );
}
