import { StyleSheet, Text, View } from 'react-native';
import { requestPermission } from '@/services/notifications/permissions';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useWotahStore } from '@/state/store';
import { DropIcon } from '@/ui/components/DropIcon';
import { OnboardingScaffold } from '@/ui/components/OnboardingScaffold';
import { MAX_FONT_SCALE, typography } from '@/ui/theme/typography';
import { useTheme } from '@/ui/theme/useTheme';
import { getApp } from '@/usecases/container';

/** Onboarding 4/4: explain, then ask (FR-008). Declining still finishes onboarding (AS-2.4). */
export default function PermissionStep() {
  const { colors } = useTheme();
  const glasses = useOnboardingDraft((s) => s.dailyGoalMl / 250);

  const finish = async (ask: boolean) => {
    const permission = ask ? await requestPermission() : 'undetermined';
    useWotahStore.setState({ permission });
    const { weightKg, dailyGoalMl, wakeMinutes, sleepMinutes, reset } =
      useOnboardingDraft.getState();
    await getApp().completeOnboarding({ weightKg, dailyGoalMl, wakeMinutes, sleepMinutes });
    reset();
  };

  return (
    <OnboardingScaffold
      step={4}
      title="Posso te dar um toquinho?"
      subtitle="Eu aviso na hora certa pra você chegar na meta antes de dormir. Dá pra registrar o gole direto na notificação, sem abrir o app."
      primaryLabel="Permitir lembretes"
      onPrimary={() => finish(true)}
      secondaryLabel="Agora não"
      onSecondary={() => finish(false)}
    >
      <View
        style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.line }]}
        accessible
        accessibilityLabel="Exemplo de lembrete: Hora de um golinho! Com o botão Bebi."
      >
        <View style={styles.previewHeader}>
          <View style={[styles.appIcon, { backgroundColor: colors.waterAccent }]}>
            <DropIcon size={18} withCheeks={false} />
          </View>
          <Text style={[typography.caption, { color: colors.ink2 }]}>WOTAH · agora</Text>
        </View>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.button, { color: colors.ink }]}
        >
          Hora de um golinho! 💧
        </Text>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.caption, { color: colors.ink2 }]}
        >
          {`Faltam ${glasses} copos pra meta de hoje.`}
        </Text>
        <View style={[styles.action, { backgroundColor: colors.plusButton }]}>
          <Text style={[typography.button, { color: colors.onWater }]}>Bebi 💧</Text>
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', borderRadius: 22, borderWidth: 1.5, padding: 14, gap: 4 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    marginTop: 10,
    borderRadius: 16,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
