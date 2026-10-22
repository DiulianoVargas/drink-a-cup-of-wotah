import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DropIcon } from './DropIcon';

type Props = {
  /** Increments on every sip from "+"; 0 = idle. */
  flightKey: number;
  /** Vertical distance (pt) from the "+" to the bottle neck. */
  distance: number;
  color: string;
};

/** A drop flies from "+" to the bottle neck, accelerating (0–520 ms). Skipped with Reduce Motion. */
export function FlyingDrop({ flightKey, distance, color }: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(1);

  useEffect(() => {
    if (flightKey === 0 || reduceMotion) return;
    progress.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) }),
    );
  }, [flightKey, reduceMotion, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 1 ? 1 : 0,
    transform: [{ translateY: -distance * progress.value }, { scale: 1 - 0.35 * progress.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.drop, style]}>
      <DropIcon size={28} color={color} withCheeks={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drop: { position: 'absolute', alignSelf: 'center', bottom: 30 },
});
