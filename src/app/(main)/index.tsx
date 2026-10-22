import { Link } from 'expo-router';
import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { homeCopy, mascotLabel, undoMenuHint } from '@/domain/homeCopy';
import { expressionFor, waterLevel } from '@/domain/progress';
import { goalHaptic, sipHaptic } from '@/services/haptics';
import { useWotahStore } from '@/state/store';
import { ConfettiBurst } from '@/ui/components/ConfettiBurst';
import { DropIcon } from '@/ui/components/DropIcon';
import { FlyingDrop } from '@/ui/components/FlyingDrop';
import { Mascot } from '@/ui/components/Mascot';
import { PlusButton } from '@/ui/components/PlusButton';
import { ProgressCounter } from '@/ui/components/ProgressCounter';
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

  const [mascotBox, setMascotBox] = useState({ y: 0, height: 0 });
  const [plusY, setPlusY] = useState(0);
  const [flightKey, setFlightKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);

  if (!today || !profile) return null;
  const { consumedMl, goalMl } = today;
  const copy = homeCopy(consumedMl, goalMl, profile.sleepMinutes);
  const mascotWidth = Math.min(MASCOT_MAX_WIDTH, (mascotBox.height * 260) / 320);

  const drink = async () => {
    sipHaptic();
    setFlightKey((k) => k + 1);
    const before = consumedMl;
    const after = await getApp().registerSip('button');
    if (after && before < after.goalMl && after.consumedMl >= after.goalMl) {
      goalHaptic();
      setBurstKey((k) => k + 1);
    }
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
        <ConfettiBurst burstKey={burstKey} />
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

      <View style={styles.reminderSlot} />

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
