// Live Activity / Dynamic Island (contracts/live-activity.md; design/Wotah Live Activity.html).
// The 'widget' function runs in an isolated runtime: only @expo/ui components and modifiers, no
// hooks or imports, and constants must live inside the function. All values arrive pre-computed
// in SurfaceState (src/domain/surface.ts), so nothing here is a business rule.
import {
  Button,
  Gauge,
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  monospacedDigit,
  padding,
  progressViewStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';
import type { SurfaceState } from '@/domain/types';

const WotahDay = (props: SurfaceState) => {
  'widget';
  const WATER = '#9FD8EA';
  const MINT = '#BEEBD8';
  const INK = '#2B4656';
  const INK_2 = '#567282';
  const ON_WATER = '#1F3E4D';
  const accent = props.celebrating ? MINT : WATER;
  const level = Math.min(props.progress, 1);

  const drop = (size: number) => <Image systemName="drop.fill" size={size} color={accent} />;

  const counter = (size: number, onDark: boolean) => (
    <HStack spacing={2} alignment="firstTextBaseline">
      <Text
        modifiers={[
          font({ size, weight: 'heavy', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle(onDark ? WATER : INK),
        ]}
      >
        {props.consumedLabel}
      </Text>
      <Text
        modifiers={[
          font({ size: size * 0.6, weight: 'semibold', design: 'rounded' }),
          foregroundStyle(onDark ? '#FFFFFF' : INK_2),
        ]}
      >
        {` / ${props.goalLabel} L`}
      </Text>
    </HStack>
  );

  const next = (onDark: boolean) =>
    props.nextReminderAt === null ? null : (
      <HStack spacing={4}>
        <Text
          modifiers={[
            font({ size: 13, weight: 'semibold', design: 'rounded' }),
            foregroundStyle(onDark ? '#FFFFFFB3' : INK_2),
          ]}
        >
          Próximo lembrete em
        </Text>
        <Text
          date={new Date(props.nextReminderAt)}
          dateStyle="relative"
          modifiers={[
            font({ size: 13, weight: 'bold', design: 'rounded' }),
            monospacedDigit(),
            foregroundStyle(onDark ? '#FFFFFF' : INK),
          ]}
        />
      </HStack>
    );

  const drinkButton = (
    <Button
      label="Bebi 💧"
      target="wotah-drink"
      modifiers={[
        buttonStyle('borderedProminent'),
        tint(WATER),
        foregroundStyle(ON_WATER),
        font({ size: 15, weight: 'heavy', design: 'rounded' }),
      ]}
    />
  );

  const celebration = (onDark: boolean) => (
    <VStack alignment="leading" spacing={2}>
      <Text
        modifiers={[
          font({ size: 17, weight: 'bold', design: 'rounded' }),
          foregroundStyle(onDark ? '#FFFFFF' : INK),
        ]}
      >
        Bom trabalho! 🎉
      </Text>
      <Text
        modifiers={[
          font({ size: 13, weight: 'semibold', design: 'rounded' }),
          foregroundStyle(onDark ? '#FFFFFFB3' : INK_2),
        ]}
      >
        Meta de hoje batida. Lembretes só amanhã!
      </Text>
    </VStack>
  );

  const bar = (
    <ProgressView value={level} modifiers={[progressViewStyle('linear'), tint(accent)]} />
  );

  return {
    // Lock screen: same content as the expanded island, on a light translucent card.
    banner: (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[padding({ all: 16 }), activityBackgroundTint('#F3F9FBE6')]}
      >
        <HStack spacing={8}>
          {drop(18)}
          <Text
            modifiers={[
              font({ size: 13, weight: 'bold', design: 'rounded' }),
              foregroundStyle(INK_2),
            ]}
          >
            Wotah
          </Text>
          <Spacer />
          {counter(22, false)}
        </HStack>
        {bar}
        {props.celebrating ? (
          celebration(false)
        ) : (
          <HStack>
            {next(false)}
            <Spacer />
            {drinkButton}
          </HStack>
        )}
      </VStack>
    ),
    compactLeading: drop(16),
    compactTrailing: props.celebrating ? (
      <Text
        modifiers={[font({ size: 13, weight: 'heavy', design: 'rounded' }), foregroundStyle(MINT)]}
      >
        Meta! 🎉
      </Text>
    ) : (
      counter(13, true)
    ),
    minimal: (
      <Gauge value={level} modifiers={[gaugeStyle('circularCapacity'), tint(accent)]}>
        {drop(10)}
      </Gauge>
    ),
    expandedLeading: (
      <HStack spacing={6} modifiers={[padding({ leading: 6 })]}>
        {drop(20)}
        <Text
          modifiers={[
            font({ size: 15, weight: 'bold', design: 'rounded' }),
            foregroundStyle('#FFFFFF'),
          ]}
        >
          Wotah
        </Text>
      </HStack>
    ),
    expandedTrailing: <VStack modifiers={[padding({ trailing: 6 })]}>{counter(20, true)}</VStack>,
    expandedBottom: (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[padding({ horizontal: 6, bottom: 4 }), frame({ maxWidth: 10_000 })]}
      >
        {bar}
        {props.celebrating ? (
          celebration(true)
        ) : (
          <HStack>
            {next(true)}
            <Spacer />
            {drinkButton}
          </HStack>
        )}
      </VStack>
    ),
  };
};

export const wotahDay = createLiveActivity<SurfaceState>('WotahDay', WotahDay);
