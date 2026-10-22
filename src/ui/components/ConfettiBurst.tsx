import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { mascotColors as m } from '../theme/tokens';

const PIECES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  return {
    dx: Math.cos(angle) * (110 + (i % 3) * 25),
    dy: Math.sin(angle) * (110 + (i % 4) * 20) - 40,
    color: [m.confettiPink, m.confettiMint, m.confettiPeach, m.confettiWater][i % 4],
    round: i % 2 === 0,
  };
});

/** Short (~1 s) confetti burst behind the bottle when the goal is met. Skipped with Reduce Motion. */
export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(1);

  useEffect(() => {
    if (burstKey === 0 || reduceMotion) return;
    t.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );
  }, [burstKey, reduceMotion, t]);

  return (
    <View pointerEvents="none" style={styles.center}>
      {PIECES.map((p, i) => (
        <Piece key={i} t={t} {...p} />
      ))}
    </View>
  );
}

function Piece({ t, dx, dy, color, round }: { t: SharedValue<number> } & (typeof PIECES)[number]) {
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 1 ? 1 - t.value * 0.6 : 0,
    transform: [
      { translateX: dx * t.value },
      { translateY: dy * t.value + 60 * t.value * t.value },
      { rotate: `${t.value * 300}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.piece,
        {
          backgroundColor: color,
          borderRadius: round ? 5 : 2,
          width: round ? 9 : 13,
          height: round ? 9 : 6,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  piece: { position: 'absolute' },
});
