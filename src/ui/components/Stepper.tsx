import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_GOAL_ML, MIN_GOAL_ML } from '@/domain/constants';
import { formatLiters } from '@/domain/format';
import { stepGoalMl } from '@/domain/goal';
import { glassesText } from '@/domain/settingsCopy';
import { fonts, MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = {
  valueMl: number;
  onChange: (ml: number) => void;
  size?: 'large' | 'compact';
};

/** Goal − / + in 250 ml steps, 0.5–6 L (FR-010). */
export function Stepper({ valueMl, onChange, size = 'large' }: Props) {
  const { colors } = useTheme();
  const large = size === 'large';

  return (
    <View style={styles.row}>
      <StepButton dir={-1} valueMl={valueMl} onChange={onChange} large={large} />
      <View
        style={styles.value}
        accessible
        accessibilityLabel={`${formatLiters(valueMl)} litros, ${glassesText(valueMl)}`}
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[large ? styles.big : typography.heading, { color: colors.ink }]}
        >
          {formatLiters(valueMl)}
          <Text style={[large ? styles.unit : null, { color: colors.ink2 }]}> L</Text>
        </Text>
      </View>
      <StepButton dir={1} valueMl={valueMl} onChange={onChange} large={large} />
    </View>
  );
}

function StepButton({
  dir,
  valueMl,
  onChange,
  large,
}: {
  dir: 1 | -1;
  valueMl: number;
  onChange: (ml: number) => void;
  large: boolean;
}) {
  const { colors } = useTheme();
  const disabled = dir === 1 ? valueMl >= MAX_GOAL_ML : valueMl <= MIN_GOAL_ML;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir === 1 ? 'Aumentar meta em 250 ml' : 'Diminuir meta em 250 ml'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onChange(stepGoalMl(valueMl, dir))}
      style={[
        styles.button,
        large ? styles.buttonLarge : styles.buttonCompact,
        { backgroundColor: colors.surface2, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Text allowFontScaling={false} style={[styles.sign, { color: colors.ink }]}>
        {dir === 1 ? '+' : '−'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  button: { alignItems: 'center', justifyContent: 'center' },
  buttonLarge: { width: 60, height: 60, borderRadius: 30 },
  buttonCompact: { width: 44, height: 44, borderRadius: 22 },
  sign: { fontFamily: fonts.fredokaSemiBold, fontSize: 28, lineHeight: 32 },
  value: { minWidth: 120, alignItems: 'center' },
  big: { fontFamily: fonts.fredokaSemiBold, fontSize: 64, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: fonts.fredokaMedium, fontSize: 30 },
});
