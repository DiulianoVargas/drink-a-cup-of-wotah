// Port of the `Mascote` component from design/Wotah Sistema.html (viewBox -30 -30 260 320).
import { useEffect, useId, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { MascotExpression } from '@/domain/types';
import { mascotColors as m } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const AnimatedG = Animated.createAnimatedComponent(G);

const BOTTLE =
  'M70 38 h60 v18 q0 10 10 18 q30 22 30 60 v100 q0 36 -36 36 h-68 q-36 0 -36 -36 v-100 q0 -38 30 -60 q10 -8 10 -18 z';
const WAVE_BACK = 'M-100 0 q25 -9 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V320 H-100 Z';
const WAVE_FRONT = 'M-100 7 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V320 H-100 Z';
const SPARKLE = 'M0 -11 Q1 -1 11 0 Q1 1 0 11 Q-1 1 -11 0 Q-1 -1 0 -11Z';
/** The glow (r=150 around 100,150) overflows the -30 -30 260 320 viewBox; it gets this much extra room. */
const GLOW_PAD = 24;

/** Water surface y for a 0..1 level (design: 278 − p × 214). */
export const waterY = (level: number) => 278 - Math.min(Math.max(level, 0), 1) * 214;

/** Timing of the sip animation (research R9 / design "Animação do gole"). */
export const SIP_TIMING = {
  waterDelay: 280,
  jumpDelay: 300,
  jumpDuration: 650,
  expressionSwitch: 520,
};

type Props = {
  /** Water level 0..1 (already capped). */
  level: number;
  expression: MascotExpression;
  /** Rendered width in points; height keeps the 260:320 ratio. */
  width: number;
  accessibilityLabel?: string;
};

export function Mascot({ level, expression, width, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `clip${uid}`;
  const glowId = `glow${uid}`;

  // Water level: overshooting spring after the drop lands; no motion with Reduce Motion.
  const water = useSharedValue(waterY(level));
  const backX = useSharedValue(0);
  const frontX = useSharedValue(-100);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const previousLevel = useRef(level);
  const party = useSharedValue(0);

  // Expression switches mid-jump when the level rises (design: "a expressão troca no meio do pulo").
  const [shownExpression, setShownExpression] = useState(expression);

  useEffect(() => {
    const target = waterY(level);
    const rising = level > previousLevel.current;
    previousLevel.current = level;

    if (reduceMotion) {
      water.value = target;
    } else {
      water.value = withDelay(
        SIP_TIMING.waterDelay,
        withSpring(target, { damping: 9, stiffness: 110, mass: 1 }),
      );
    }

    if (rising && !reduceMotion) {
      const third = SIP_TIMING.jumpDuration / 3;
      scaleX.value = withDelay(
        SIP_TIMING.jumpDelay,
        withSequence(
          withTiming(1.06, { duration: third }),
          withTiming(0.97, { duration: third }),
          withTiming(1, { duration: third }),
        ),
      );
      scaleY.value = withDelay(
        SIP_TIMING.jumpDelay,
        withSequence(
          withTiming(0.93, { duration: third }),
          withTiming(1.05, { duration: third }),
          withTiming(1, { duration: third }),
        ),
      );
    }

    const timer = setTimeout(
      () => setShownExpression(expression),
      rising && !reduceMotion ? SIP_TIMING.expressionSwitch : 0,
    );
    return () => clearTimeout(timer);
  }, [level, expression, reduceMotion, water, scaleX, scaleY]);

  // Two waves drifting in opposite directions, forever (paused with Reduce Motion).
  useEffect(() => {
    if (reduceMotion) return;
    backX.value = withRepeat(
      withTiming(-100, { duration: 3400, easing: Easing.linear }),
      -1,
      false,
    );
    frontX.value = withRepeat(withTiming(0, { duration: 2600, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(backX);
      cancelAnimation(frontX);
    };
  }, [reduceMotion, backX, frontX]);

  // Celebration loop: the glow breathes, confetti floats and sparkles twinkle (static with Reduce Motion).
  const celebrating = shownExpression === 'celebrating';
  useEffect(() => {
    if (!celebrating || reduceMotion) {
      cancelAnimation(party);
      party.value = 0;
      return;
    }
    party.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(party);
  }, [celebrating, reduceMotion, party]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.75 + party.value * 0.25,
    transform: [{ scale: 0.94 + party.value * 0.1 }],
  }));
  const confettiStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (party.value - 0.5) * 8 },
      { rotate: `${(party.value - 0.5) * 6}deg` },
    ],
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: 1 - party.value * 0.55,
    transform: [{ scale: 1 + party.value * 0.06 }],
  }));

  const waterProps = useAnimatedProps(() => ({ transform: [{ translateY: water.value }] }));
  const backProps = useAnimatedProps(() => ({ transform: [{ translateX: backX.value }] }));
  const frontProps = useAnimatedProps(() => ({ transform: [{ translateX: frontX.value }] }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }, { scaleY: scaleY.value }],
  }));

  const e = shownExpression;
  const shine = e === 'radiant' || e === 'celebrating';
  const cheekOpacity = e === 'thirsty' ? 0.35 : 0.85;
  const height = (width * 320) / 260;
  const glowInset = -(GLOW_PAD * width) / 260;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width, height }}
    >
      {/* Celebration glow and confetti stay behind the jumping body. */}
      {e === 'celebrating' && (
        <Animated.View
          style={[
            styles.overflow,
            { top: glowInset, bottom: glowInset, left: glowInset, right: glowInset },
            glowStyle,
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`${-30 - GLOW_PAD} ${-30 - GLOW_PAD} ${260 + 2 * GLOW_PAD} ${320 + 2 * GLOW_PAD}`}
          >
            <Defs>
              <RadialGradient id={glowId}>
                <Stop offset="0" stopColor={m.glow} stopOpacity={0.95} />
                <Stop offset="0.6" stopColor={m.glow} stopOpacity={0.35} />
                <Stop offset="1" stopColor={m.glow} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={100} cy={150} r={150} fill={`url(#${glowId})`} />
          </Svg>
        </Animated.View>
      )}
      {e === 'celebrating' && (
        <Animated.View style={[StyleSheet.absoluteFill, confettiStyle]}>
          <Svg width="100%" height="100%" viewBox="-30 -30 260 320">
            <Rect
              x={-14}
              y={40}
              width={13}
              height={6}
              rx={2}
              fill={m.confettiPink}
              transform="rotate(-30 -8 43)"
            />
            <Rect
              x={206}
              y={28}
              width={13}
              height={6}
              rx={2}
              fill={m.confettiMint}
              transform="rotate(40 212 31)"
            />
            <Rect
              x={-22}
              y={150}
              width={12}
              height={6}
              rx={2}
              fill={m.confettiPeach}
              transform="rotate(60 -16 153)"
            />
            <Rect
              x={216}
              y={132}
              width={12}
              height={6}
              rx={2}
              fill={m.confettiPink}
              transform="rotate(-20 222 135)"
            />
            <Rect
              x={-6}
              y={256}
              width={12}
              height={6}
              rx={2}
              fill={m.confettiWater}
              transform="rotate(25 0 259)"
            />
            <Rect
              x={200}
              y={250}
              width={12}
              height={6}
              rx={2}
              fill={m.confettiPeach}
              transform="rotate(-50 206 253)"
            />
            <Circle cx={34} cy={-6} r={4.5} fill={m.confettiMint} />
            <Circle cx={170} cy={-12} r={4} fill={m.confettiPink} />
            <Circle cx={-20} cy={100} r={3.5} fill={m.confettiWater} />
            <Circle cx={222} cy={200} r={4} fill={m.confettiMint} />
          </Svg>
        </Animated.View>
      )}

      {/* Body squashes and stretches from the feet (transform origin: bottom center). */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.body, bodyStyle]}>
        <Svg width="100%" height="100%" viewBox="-30 -30 260 320">
          <Defs>
            <ClipPath id={clipId}>
              <Path d={BOTTLE} />
            </ClipPath>
          </Defs>

          <G fill="none" stroke={m.outline} strokeWidth={5} strokeLinecap="round">
            {e === 'thirsty' && (
              <>
                <Path d="M33 190 q-16 14 -14 36" />
                <Path d="M167 190 q16 14 14 36" />
              </>
            )}
            {e === 'excited' && (
              <>
                <Path d="M33 182 q-22 -2 -32 -20" />
                <Path d="M167 182 q22 -2 32 -20" />
              </>
            )}
            {e === 'radiant' && (
              <>
                <Path d="M33 172 q-24 -14 -24 -46" />
                <Path d="M167 172 q24 -14 24 -46" />
              </>
            )}
            {e === 'celebrating' && (
              <>
                <Path d="M33 168 q-30 -22 -22 -62" />
                <Path d="M167 168 q30 -22 22 -62" />
              </>
            )}
          </G>
          <Ellipse cx={74} cy={271} rx={17} ry={8} fill={m.outline} />
          <Ellipse cx={126} cy={271} rx={17} ry={8} fill={m.outline} />

          <Path d={BOTTLE} fill={colors.glass} />
          <G clipPath={`url(#${clipId})`}>
            <AnimatedG animatedProps={waterProps}>
              <AnimatedG animatedProps={backProps}>
                <Path d={WAVE_BACK} fill={colors.waveBack} />
              </AnimatedG>
              <AnimatedG animatedProps={frontProps}>
                <Path d={WAVE_FRONT} fill={colors.water} />
              </AnimatedG>
            </AnimatedG>
          </G>
          <Path d={BOTTLE} fill="none" stroke={m.outline} strokeWidth={5} strokeLinejoin="round" />
          <Path
            d="M47 132 q2 -24 20 -40"
            fill="none"
            stroke={m.white}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={0.9}
          />
          <Circle cx={45} cy={150} r={3.5} fill={m.white} opacity={0.9} />

          <Rect
            x={64}
            y={8}
            width={72}
            height={34}
            rx={13}
            fill={m.cap}
            stroke={m.outline}
            strokeWidth={5}
          />
          <G stroke={m.capStripes} strokeWidth={3} strokeLinecap="round">
            <Path d="M84 18 v14" />
            <Path d="M100 18 v14" />
            <Path d="M116 18 v14" />
          </G>

          <Ellipse cx={60} cy={190} rx={10} ry={6} fill={m.cheeks} opacity={cheekOpacity} />
          <Ellipse cx={140} cy={190} rx={10} ry={6} fill={m.cheeks} opacity={cheekOpacity} />

          <Face expression={e} />
        </Svg>
      </Animated.View>

      {shine && (
        <Animated.View style={[StyleSheet.absoluteFill, sparkleStyle]}>
          <Svg width="100%" height="100%" viewBox="-30 -30 260 320">
            <G stroke={m.outline} strokeWidth={2.5} strokeLinejoin="round">
              <Path transform="translate(-6 92) scale(1.15)" d={SPARKLE} fill={m.cap} />
              <Path transform="translate(208 78)" d={SPARKLE} fill={m.waterLight} />
              <Path transform="translate(200 214) scale(.8)" d={SPARKLE} fill={m.confettiMint} />
            </G>
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

function Face({ expression }: { expression: MascotExpression }) {
  const ink = m.outline;
  switch (expression) {
    case 'thirsty':
      return (
        <G>
          <Path d="M68 166 h20 a10 10 0 0 1 -20 0 z" fill={ink} />
          <Path d="M112 166 h20 a10 10 0 0 1 -20 0 z" fill={ink} />
          <Path d="M65 161 l25 3" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Path d="M135 161 l-25 3" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Path
            d="M100 199 q0 11 7 11 q7 0 7 -11 z"
            fill={m.tongue}
            stroke={ink}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
          <Path
            d="M86 200 q7 -6 14 -1 q7 5 14 0"
            fill="none"
            stroke={ink}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
          <Path
            d="M190 98 q-8 11 -8 16 a8 8 0 0 0 16 0 q0 -5 -8 -16 z"
            fill={m.waterLight}
            stroke={ink}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
        </G>
      );
    case 'excited':
      return (
        <G>
          <Circle cx={78} cy={168} r={9.5} fill={ink} />
          <Circle cx={122} cy={168} r={9.5} fill={ink} />
          <Circle cx={81.5} cy={164} r={3.4} fill={m.white} />
          <Circle cx={125.5} cy={164} r={3.4} fill={m.white} />
          <Path
            d="M86 188 q14 18 28 0 z"
            fill={ink}
            stroke={ink}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path d="M93 195 q7 6 14 0 q-7 -4 -14 0 z" fill={m.tongue} />
        </G>
      );
    case 'radiant':
      return (
        <G>
          <Path
            d="M67 171 q11 -14 22 0"
            fill="none"
            stroke={ink}
            strokeWidth={5.5}
            strokeLinecap="round"
          />
          <Path
            d="M111 171 q11 -14 22 0"
            fill="none"
            stroke={ink}
            strokeWidth={5.5}
            strokeLinecap="round"
          />
          <Path
            d="M81 185 q19 26 38 0 z"
            fill={ink}
            stroke={ink}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path d="M91 197 q9 8 18 0 q-9 -6 -18 0 z" fill={m.tongue} />
        </G>
      );
    case 'celebrating':
      return (
        <G>
          <Path
            d="M68 160 l16 8 l-16 8"
            fill="none"
            stroke={ink}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M132 160 l-16 8 l16 8"
            fill="none"
            stroke={ink}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M78 184 q22 32 44 0 z"
            fill={ink}
            stroke={ink}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path d="M89 198 q11 9 22 0 q-11 -7 -22 0 z" fill={m.tongue} />
          <Path
            d="M80 10 L100 -20 L120 10 Z"
            fill={m.confettiPink}
            stroke={ink}
            strokeWidth={4.5}
            strokeLinejoin="round"
          />
          <Path d="M90 -4 l20 -2" stroke={m.white} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={100} cy={-22} r={6} fill={m.confettiMint} stroke={ink} strokeWidth={3.5} />
        </G>
      );
  }
}

const styles = StyleSheet.create({
  body: { transformOrigin: 'bottom' },
  overflow: { position: 'absolute' },
});
