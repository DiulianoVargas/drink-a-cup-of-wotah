import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { awakeHint, formatTimeOfDay } from '@/domain/settingsCopy';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { OnboardingScaffold } from '@/ui/components/OnboardingScaffold';
import { WheelPicker } from '@/ui/components/WheelPicker';
import { HALF_HOURS } from '@/ui/pickerValues';
import { MAX_FONT_SCALE, typography } from '@/ui/theme/typography';
import { useTheme } from '@/ui/theme/useTheme';

/** Onboarding 3/4 (FR-008): wake and sleep times. */
export default function ScheduleStep() {
  const router = useRouter();
  const { colors } = useTheme();
  const { wakeMinutes, sleepMinutes, dailyGoalMl, setWake, setSleep } = useOnboardingDraft();
  return (
    <OnboardingScaffold
      step={3}
      title="Que horas você acorda e dorme?"
      subtitle="Só te lembro nesse intervalo, prometo."
      onPrimary={() => router.push('/permission')}
    >
      <View style={styles.row}>
        <View style={styles.column}>
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[typography.button, { color: colors.ink2 }]}
          >
            Acordo
          </Text>
          <WheelPicker
            values={HALF_HOURS}
            value={wakeMinutes}
            onChange={(m) => m !== sleepMinutes && setWake(m)}
            format={formatTimeOfDay}
            accessibilityLabel="Horário em que acordo"
            width={130}
          />
        </View>
        <View style={styles.column}>
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[typography.button, { color: colors.ink2 }]}
          >
            Durmo
          </Text>
          <WheelPicker
            values={HALF_HOURS}
            value={sleepMinutes}
            onChange={(m) => m !== wakeMinutes && setSleep(m)}
            format={formatTimeOfDay}
            accessibilityLabel="Horário em que durmo"
            width={130}
          />
        </View>
      </View>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.caption, styles.hint, { color: colors.ink2 }]}
      >
        {awakeHint({ wakeMinutes, sleepMinutes, dailyGoalMl })}
      </Text>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16 },
  column: { alignItems: 'center', gap: 6 },
  hint: { marginTop: 12, textAlign: 'center' },
});
