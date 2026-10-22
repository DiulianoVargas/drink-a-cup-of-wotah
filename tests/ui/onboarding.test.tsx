import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GoalStep from '@/app/(onboarding)/goal';
import PermissionStep from '@/app/(onboarding)/permission';
import ScheduleStep from '@/app/(onboarding)/schedule';
import WeightStep from '@/app/(onboarding)/weight';
import { useOnboardingDraft } from '@/state/onboardingDraft';

const mockPush = jest.fn();
const mockComplete = jest.fn(async () => null);
const mockRequest = jest.fn(async () => 'granted');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (href: string) => mockPush(href) }),
}));
jest.mock('@/usecases/container', () => ({
  getApp: () => ({ completeOnboarding: mockComplete }),
}));
jest.mock('@/services/notifications/permissions', () => ({
  requestPermission: () => mockRequest(),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const show = (Screen: () => React.ReactElement | null) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Screen />
    </SafeAreaProvider>,
  );

describe('Onboarding (US2, FR-008, SC-001)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingDraft.getState().reset();
  });

  it('steps go weight → goal → schedule → permission with "Continuar"', async () => {
    await show(WeightStep);
    expect(screen.getByText('Quanto você pesa?')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continuar'));
    expect(mockPush).toHaveBeenLastCalledWith('/goal');

    await show(GoalStep);
    expect(screen.getByText('Sua meta diária')).toBeTruthy();
    expect(
      screen.getByText('Pra 70 kg, a gente sugere 2,5 L por dia. Pode ajustar do seu jeito.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText('Continuar'));
    expect(mockPush).toHaveBeenLastCalledWith('/schedule');

    await show(ScheduleStep);
    expect(screen.getByText('14 horas acordado · um lembrete a cada ~1h')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continuar'));
    expect(mockPush).toHaveBeenLastCalledWith('/permission');
  });

  it('the goal stepper changes 250 ml per tap (AS-2.2)', async () => {
    await show(GoalStep);
    await fireEvent.press(screen.getByLabelText('Diminuir meta em 250 ml'));
    expect(useOnboardingDraft.getState().dailyGoalMl).toBe(2250);
    expect(screen.getByLabelText('2,25 litros, 9 copos de 250 ml')).toBeTruthy();
  });

  it('a weight change re-suggests the goal until the goal is edited by hand', () => {
    const draft = useOnboardingDraft.getState();
    draft.setWeight(60);
    expect(useOnboardingDraft.getState().dailyGoalMl).toBe(2000);
    useOnboardingDraft.getState().setGoal(3000);
    useOnboardingDraft.getState().setWeight(80);
    expect(useOnboardingDraft.getState().dailyGoalMl).toBe(3000);
  });

  it('"Permitir lembretes" asks iOS, then finishes with the defaults (AS-2.3)', async () => {
    await show(PermissionStep);
    await fireEvent.press(screen.getByText('Permitir lembretes'));
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockComplete).toHaveBeenCalledWith({
      weightKg: 70,
      dailyGoalMl: 2500,
      wakeMinutes: 480,
      sleepMinutes: 1320,
    });
  });

  it('"Agora não" finishes without asking (AS-2.4)', async () => {
    await show(PermissionStep);
    await fireEvent.press(screen.getByText('Agora não'));
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });
});
