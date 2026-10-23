import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { suggestGoalMl } from '@/domain/goal';
import { glassesText, goalSuggestionText } from '@/domain/settingsCopy';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { OnboardingScaffold } from '@/ui/components/OnboardingScaffold';
import { Stepper } from '@/ui/components/Stepper';
import { MAX_FONT_SCALE, typography } from '@/ui/theme/typography';
import { useTheme } from '@/ui/theme/useTheme';

/** Onboarding 2/4 (FR-009, FR-010): suggested goal, editable in 250 ml steps. */
export default function GoalStep() {
  const router = useRouter();
  const { colors } = useTheme();
  const { weightKg, dailyGoalMl, setGoal } = useOnboardingDraft();
  const suggested = suggestGoalMl(weightKg);
  return (
    <OnboardingScaffold
      step={2}
      title="Sua meta diária"
      subtitle={goalSuggestionText(weightKg, suggested)}
      onPrimary={() => router.push('/schedule')}
    >
      <View style={styles.center}>
        <Stepper valueMl={dailyGoalMl} onChange={setGoal} />
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.caption, { color: colors.ink2 }]}
        >
          {`${glassesText(dailyGoalMl)} · cada toque muda 1 copo`}
        </Text>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.caption, { color: colors.ink2 }]}
        >
          {`Sugestão: ${weightKg} kg × 35 ml`}
        </Text>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 12 },
});
