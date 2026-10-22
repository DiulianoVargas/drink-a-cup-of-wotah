import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { homeCopy, mascotLabel, undoMenuHint } from '@/domain/homeCopy';
import { expressionFor, waterLevel } from '@/domain/progress';
import { goalHaptic, sipHaptic } from '@/services/haptics';
import { requestPermission } from '@/services/notifications/permissions';
import { useWotahStore } from '@/state/store';
import { ConfettiBurst } from '@/ui/components/ConfettiBurst';
import { DropIcon } from '@/ui/components/DropIcon';
import { FlyingDrop } from '@/ui/components/FlyingDrop';
import { Mascot } from '@/ui/components/Mascot';
import { NextReminderHint } from '@/ui/components/NextReminderHint';
import { PlusButton } from '@/ui/components/PlusButton';
import { ProgressCounter } from '@/ui/components/ProgressCounter';
import { RemindersOffBanner } from '@/ui/components/RemindersOffBanner';
import { UndoToast } from '@/ui/components/UndoToast';
import { fonts, MAX_FONT_SCALE, typography } from '@/ui/theme/typography';
import { useTheme } from '@/ui/theme/useTheme';
import { getApp } from '@/usecases/container';

const MASCOT_MAX_WIDTH = 220;

export default function Home() {
  const { colors } = useTheme();
  const today = useWotahStore((s) => s.today);
  const profile = useWotahStore((s) => s.profile);
  const undoToastKey = useWotahStore((s) => s.undoToastKey);
  const celebrateKey = useWotahStore((s) => s.celebrateKey);
  const permission = useWotahStore((s) => s.permission);
  const nextReminderAt = useWotahStore((s) => s.nextReminderAt);

  const [mascotBox, setMascotBox] = useState({ y: 0, height: 0 });
  const [plusY, setPlusY] = useState(0);
  const [flightKey, setFlightKey] = useState(0);

  // FR-018: success haptic whenever the day reaches its goal (any source).
  useEffect(() => {
    if (celebrateKey > 0) goalHaptic();
  }, [celebrateKey]);

  if (!today || !profile) return null;
  const { consumedMl, goalMl } = today;
  const copy = homeCopy(consumedMl, goalMl, profile.sleepMinutes);
  const mascotWidth = Math.min(MASCOT_MAX_WIDTH, (mascotBox.height * 260) / 320);
  // AS-2.4: manual logging keeps working; a discreet notice explains how to turn reminders on.
  const remindersOff: 'permission' | 'app' | null =
    permission !== 'granted' ? 'permission' : !profile.remindersEnabled ? 'app' : null;

  const drink = () => {
    sipHaptic();
    setFlightKey((k) => k + 1);
    getApp().registerSip('button');
  };

  const onMascotLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setMascotBox({ y, height });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.brand} accessibilityRole="header">
          <DropIcon size={28} withCheeks={false} color={colors.water} eyeColor={colors.onWater} />
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[styles.brandText, { color: colors.ink }]}
          >
            wotah
          </Text>
        </View>
        <View style={styles.headerActions}>
          {__DEV__ && (
            <Link href="/dev/tools" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ferramentas de desenvolvimento"
                style={[
                  styles.roundButton,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <Text style={[typography.caption, { color: colors.ink }]}>dev</Text>
              </Pressable>
            </Link>
          )}
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
              style={[
                styles.roundButton,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <GearIcon color={colors.ink} />
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.copy}>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.heading, styles.center, { color: colors.ink }]}
        >
          {copy.message}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.sub, { color: colors.ink2 }]}>
          {copy.sub}
        </Text>
      </View>

      <View style={styles.mascotArea} onLayout={onMascotLayout}>
        <ConfettiBurst burstKey={celebrateKey} />
        {mascotWidth > 0 && (
          <Mascot
            level={waterLevel(consumedMl, goalMl)}
            expression={expressionFor(consumedMl, goalMl)}
            width={mascotWidth}
            accessibilityLabel={mascotLabel(consumedMl, goalMl)}
          />
        )}
      </View>

      <ProgressCounter consumedMl={consumedMl} goalMl={goalMl} />

      <View style={styles.reminderSlot}>
        {!remindersOff && (
          <NextReminderHint
            nextReminderAt={nextReminderAt}
            goalMet={consumedMl >= goalMl}
            now={new Date()}
          />
        )}
        {remindersOff && (
          <RemindersOffBanner
            reason={remindersOff}
            onActivate={async () => {
              if (remindersOff === 'app') await getApp().updateProfile({ remindersEnabled: true });
              else if (permission === 'undetermined') {
                useWotahStore.setState({ permission: await requestPermission() });
              } else Linking.openSettings();
            }}
          />
        )}
      </View>

      <View style={styles.plusArea} onLayout={(e) => setPlusY(e.nativeEvent.layout.y)}>
        <FlyingDrop
          flightKey={flightKey}
          distance={Math.max(0, plusY - mascotBox.y - mascotBox.height * 0.1)}
          color={colors.water}
        />
        <PlusButton
          onPress={drink}
          onUndo={() => getApp().undoLastSip()}
          canUndo={consumedMl > 0}
          undoHint={undoMenuHint(consumedMl)}
        />
      </View>

      <View style={styles.toastSlot} pointerEvents="box-none">
        <UndoToast showKey={undoToastKey} onUndo={() => getApp().undoLastSip()} />
      </View>
    </SafeAreaView>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2.8l1.6 2.1 2.6-.5.7 2.5 2.4 1.2-.9 2.5 1.4 2.2-2.1 1.6.2 2.7-2.6.4-1.1 2.4-2.4-1.1L9.4 20l-1-2.5-2.6-.5.3-2.6-2.1-1.7 1.5-2.2-.8-2.5 2.4-1.1.8-2.5 2.6.6z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  header: {
    width: '100%',
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: fonts.fredokaSemiBold, fontSize: 26 },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { marginTop: 14, paddingHorizontal: 32, gap: 4, alignItems: 'center' },
  center: { textAlign: 'center' },
  sub: { fontFamily: fonts.nunitoBold, fontSize: 15, textAlign: 'center' },
  mascotArea: {
    flex: 1,
    minHeight: 160,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderSlot: { marginTop: 12, minHeight: 24 },
  plusArea: { marginTop: 16, marginBottom: 24, alignItems: 'center' },
  toastSlot: { position: 'absolute', left: 20, right: 20, bottom: 44 },
});
