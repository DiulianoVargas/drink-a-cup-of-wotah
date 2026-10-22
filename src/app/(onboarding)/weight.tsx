import { router } from 'expo-router';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { OnboardingScaffold } from '@/ui/components/OnboardingScaffold';
import { WheelPicker } from '@/ui/components/WheelPicker';
import { WEIGHTS } from '@/ui/pickerValues';

/** Onboarding 1/4 (FR-008): weight wheel 30–250 kg, starting at 70. */
export default function WeightStep() {
  const weightKg = useOnboardingDraft((s) => s.weightKg);
  const setWeight = useOnboardingDraft((s) => s.setWeight);
  return (
    <OnboardingScaffold
      step={1}
      title="Quanto você pesa?"
      subtitle="É só pra calcular sua meta de água. Fica guardado só no seu iPhone."
      onPrimary={() => router.push('/goal')}
    >
      <WheelPicker
        values={WEIGHTS}
        value={weightKg}
        onChange={setWeight}
        format={String}
        unit="kg"
        accessibilityLabel="Peso em quilos"
      />
    </OnboardingScaffold>
  );
}
