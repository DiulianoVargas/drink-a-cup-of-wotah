// Opening screen (FR-035): design/Wotah Splash.html, contract in contracts/splash.md.
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { splashGlowOpacity } from '../theme/tokens';
import { fonts, MAX_FONT_SCALE } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { Mascot } from './Mascot';

const MASCOT_WIDTH = 180;
/** Width of the native splash image (app.config.ts; Android fits the 12+ circular mask, R16). */
const NATIVE_WIDTH = Platform.OS === 'android' ? 120 : 180;
const ENTER_MS = 450;
const REDUCED_ENTER_MS = 250;
const MIN_VISIBLE_MS = 900;
const EXIT_MS = 280;
const DOT_CYCLE_MS = 900;
const DOT_STAGGER_MS = 150;
const STATIC_DOTS = [1, 0.55, 0.25];
/** CSS radial-gradient(circle, …) on a 420 pt box ends at 65% of the farthest corner (210√2). */
const GLOW_RADIUS = 0.65 * 210 * Math.SQRT2;

type Props = {
  /** True once boot finished (store `ready`); the overlay may start leaving. */
  ready: boolean;
  /** Called once after the exit fade; the parent unmounts the overlay. */
  onDone: () => void;
};

/**
 * Takes over from the static OS splash: its first frame is the native image (mascot centered at the
 * native width), then it animates into the design layout and fades out once the app is ready.
 */
export function AnimatedSplash({ ready, onDone }: Props) {
  const { colors, dark } = useTheme();
  const reduceMotion = useReducedMotion();
  const [screen, setScreen] = useState<{ width: number; height: number } | null>(null);
  const [mascotBox, setMascotBox] = useState<{ y: number; height: number } | null>(null);
  const [entered, setEntered] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const leaving = ready && entered && minElapsed;

  const started = useRef(false);
  const exited = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const backdrop = useSharedValue(0);
  const content = useSharedValue(0);
  const mascotOpacity = useSharedValue(1);
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const overlay = useSharedValue(1);
  const pulse = useSharedValue(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const pending = timers.current;
    later(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => pending.forEach(clearTimeout);
  }, []);

  // Enter: once both layouts are known, match the native image, hide it, then animate into place.
  useEffect(() => {
    if (started.current || !screen || !mascotBox) return;
    started.current = true;

    if (reduceMotion) {
      mascotOpacity.value = 0;
    } else {
      lift.value = screen.height / 2 - (mascotBox.y + mascotBox.height / 2);
      scale.value = NATIVE_WIDTH / MASCOT_WIDTH;
    }

    requestAnimationFrame(() => {
      SplashScreen.hide();
      if (reduceMotion) {
        const fade = { duration: REDUCED_ENTER_MS };
        backdrop.value = withTiming(1, fade);
        mascotOpacity.value = withTiming(1, fade);
        content.value = withTiming(1, fade);
        return;
      }
      const ease = { duration: ENTER_MS, easing: Easing.out(Easing.cubic) };
      backdrop.value = withTiming(1, { duration: 300 });
      lift.value = withTiming(0, ease);
      scale.value = withTiming(1, ease);
      content.value = withDelay(150, withTiming(1, { duration: 350 }));
      pulse.value = withDelay(
        ENTER_MS,
        withRepeat(withTiming(1, { duration: DOT_CYCLE_MS, easing: Easing.linear }), -1, false),
      );
    });
    later(() => setEntered(true), reduceMotion ? REDUCED_ENTER_MS : ENTER_MS);
  }, [screen, mascotBox, reduceMotion, backdrop, content, mascotOpacity, lift, scale, pulse]);

  // Safety net: never keep the OS splash up if a layout pass never arrives.
  useEffect(() => {
    if (!minElapsed || started.current) return;
    started.current = true;
    SplashScreen.hide();
    backdrop.set(1);
    content.set(1);
    setEntered(true);
  }, [minElapsed, backdrop, content]);

  // Exit: ready, entered and shown for at least MIN_VISIBLE_MS → fade out, then onDone once.
  useEffect(() => {
    if (!leaving || exited.current) return;
    exited.current = true;
    overlay.value = withTiming(0, { duration: EXIT_MS });
    later(() => onDoneRef.current(), EXIT_MS);
  }, [leaving, overlay]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: content.value,
    transform: [{ translateY: (1 - content.value) * 8 }],
  }));

  const onRootLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!screen) setScreen({ width, height });
  };
  const onMascotLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    if (!mascotBox) setMascotBox({ y, height });
  };

  const glowOpacity = dark ? splashGlowOpacity.dark : splashGlowOpacity.light;

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Wotah, carregando"
      accessibilityViewIsModal
      pointerEvents={leaving ? 'none' : 'auto'}
      onLayout={onRootLayout}
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, overlayStyle]}
    >
      <View style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
        {screen && (
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Svg width={screen.width} height={screen.height}>
              <Defs>
                <LinearGradient id="splashBg" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.splashTop} />
                  <Stop offset="0.55" stopColor={colors.bg} />
                  <Stop offset="1" stopColor={colors.splashBottom} />
                </LinearGradient>
                <RadialGradient id="splashGlow">
                  <Stop offset="0" stopColor={colors.water} stopOpacity={glowOpacity} />
                  <Stop offset="1" stopColor={colors.water} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width={screen.width} height={screen.height} fill="url(#splashBg)" />
              <Circle
                cx={screen.width / 2}
                cy={screen.height / 2 - 50}
                r={GLOW_RADIUS}
                fill="url(#splashGlow)"
              />
            </Svg>
          </Animated.View>
        )}

        <View style={styles.column}>
          <Animated.View testID="splash-mascot" onLayout={onMascotLayout} style={mascotStyle}>
            <Mascot level={0.6} expression="excited" width={MASCOT_WIDTH} />
          </Animated.View>
          <Animated.View style={[styles.words, contentStyle]}>
            <Text
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[styles.wordmark, { color: colors.ink }]}
            >
              wotah
            </Text>
            <Text
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              style={[styles.tagline, { color: colors.ink2 }]}
            >
              Um golinho de cada vez
            </Text>
          </Animated.View>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.dotsArea} pointerEvents="none">
          <Animated.View style={[styles.dots, contentStyle]}>
            {STATIC_DOTS.map((opacity, i) => (
              <Dot
                key={i}
                index={i}
                pulse={pulse}
                staticOpacity={opacity}
                animated={!reduceMotion}
                color={colors.plusButton}
              />
            ))}
          </Animated.View>
        </SafeAreaView>
      </View>
    </Animated.View>
  );
}

type DotProps = {
  index: number;
  pulse: SharedValue<number>;
  staticOpacity: number;
  animated: boolean;
  color: string;
};

/** Loading dot: pulses .25 → 1 → .25 in sequence; static at the design opacity with Reduce Motion. */
function Dot({ index, pulse, staticOpacity, animated, color }: DotProps) {
  const style = useAnimatedStyle(() => {
    if (!animated) return { opacity: staticOpacity };
    const phase = (pulse.value - (index * DOT_STAGGER_MS) / DOT_CYCLE_MS + 1) % 1;
    return { opacity: 0.25 + 0.75 * (1 - Math.abs(2 * phase - 1)) };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingBottom: 60,
  },
  words: { alignItems: 'center', gap: 6 },
  wordmark: {
    fontFamily: fonts.fredokaSemiBold,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  tagline: { fontFamily: fonts.nunitoBold, fontSize: 16 },
  dotsArea: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 64 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
