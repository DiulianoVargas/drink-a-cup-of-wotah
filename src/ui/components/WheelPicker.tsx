import { useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fonts } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

const ITEM_H = 48;
const VISIBLE = 5;

type Props<T> = {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
  accessibilityLabel: string;
  /** Unit drawn beside the selected value, e.g. "kg". */
  unit?: string;
  width?: number;
};

/** Snapping wheel (weight 30–250 kg, times every 30 min). VoiceOver: adjustable with swipe up/down. */
export function WheelPicker<T>({
  values,
  value,
  onChange,
  format,
  accessibilityLabel,
  unit,
  width = 140,
}: Props<T>) {
  const { colors } = useTheme();
  const list = useRef<FlatList<T>>(null);
  const index = Math.max(0, values.indexOf(value));

  const select = (i: number, scroll: boolean) => {
    const clamped = Math.min(Math.max(i, 0), values.length - 1);
    if (values[clamped] !== value) onChange(values[clamped]);
    if (scroll) list.current?.scrollToIndex({ index: clamped, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    select(Math.round(e.nativeEvent.contentOffset.y / ITEM_H), false);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: `${format(value)}${unit ? ` ${unit}` : ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        select(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1), true)
      }
      style={[styles.wrap, { width, height: ITEM_H * VISIBLE }]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.band,
          { backgroundColor: colors.surface2, top: ITEM_H * Math.floor(VISIBLE / 2) },
        ]}
      />
      <FlatList
        ref={list}
        data={values as T[]}
        keyExtractor={(item) => String(item)}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        importantForAccessibility="no-hide-descendants"
        renderItem={({ item, index: i }) => {
          const selected = i === index;
          return (
            <View style={styles.item}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.text,
                  {
                    color: selected ? colors.ink : colors.ink2,
                    opacity: selected ? 1 : 0.45,
                    fontSize: selected ? 30 : 22,
                  },
                ]}
              >
                {format(item)}
                {selected && unit ? <Text style={styles.unit}>{` ${unit}`}</Text> : null}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM_H, borderRadius: 16 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.fredokaSemiBold, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: fonts.fredokaMedium, fontSize: 18 },
});
