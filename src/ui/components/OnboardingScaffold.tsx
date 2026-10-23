import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { Mascot } from './Mascot';
import { Pill } from './Pill';

type Props = {
  /** 1-based step of 4; the bottle fills a little on each step. */
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  children: ReactNode;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function OnboardingScaffold({
  step,
  title,
  subtitle,
  children,
  primaryLabel = 'Continuar',
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <View style={styles.dots} accessible accessibilityLabel={`Passo ${step} de 4`}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= step ? colors.water : colors.line,
                width: i === step ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <Mascot level={step / 8} expression={step < 3 ? 'thirsty' : 'excited'} width={86} />
        <View style={styles.copy}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[typography.title, styles.center, { color: colors.ink }]}
          >
            {title}
          </Text>
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[typography.body, styles.center, { color: colors.ink2 }]}
          >
            {subtitle}
          </Text>
        </View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View style={styles.actions}>
        <Pill label={primaryLabel} onPress={onPrimary} />
        {secondaryLabel && onSecondary ? (
          <Pill tone="secondary" label={secondaryLabel} onPress={onSecondary} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 12 },
  dot: { height: 8, borderRadius: 4 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 24, gap: 20 },
  copy: { gap: 8, alignItems: 'center' },
  center: { textAlign: 'center' },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  actions: { paddingHorizontal: 24, paddingBottom: 12, gap: 10 },
});
