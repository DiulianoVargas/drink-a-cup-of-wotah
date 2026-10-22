import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Home from '@/app/(main)/index';
import { useWotahStore } from '@/state/store';
import { PROFILE } from '../helpers/fakes';

const mockRegisterSip = jest.fn(async () => null);
const mockUndoLastSip = jest.fn(async () => null);
jest.mock('@/usecases/container', () => ({
  getApp: () => ({ registerSip: mockRegisterSip, undoLastSip: mockUndoLastSip }),
}));
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const show = async (consumedMl: number, goalMl = 2000) => {
  useWotahStore.setState({
    ready: true,
    profile: PROFILE,
    today: { dayKey: '2026-10-22', goalMl, consumedMl, lastSipAt: null },
    nextReminderAt: null,
    undoToastKey: 0,
  });
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Home />
    </SafeAreaProvider>,
  );
};

describe('Home (US1)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('day start: thirsty copy and 0 / 2 L', async () => {
    await show(0);
    expect(screen.getByText('Bom dia! Bora começar com um golinho?')).toBeTruthy();
    expect(screen.getByLabelText('0 de 2 litros')).toBeTruthy();
  });

  it('"+" logs a sip from the button (FR-002)', async () => {
    await show(500);
    await fireEvent.press(screen.getByLabelText('Registrar um copo de 250 ml'));
    expect(mockRegisterSip).toHaveBeenCalledWith('button');
  });

  it('goal met shows "Bom trabalho! 🎉" (FR-018)', async () => {
    await show(2000);
    expect(screen.getByText('Bom trabalho! 🎉')).toBeTruthy();
    expect(screen.getByText('Você bateu a meta de hoje')).toBeTruthy();
  });

  it('keeps counting above the goal (FR-007)', async () => {
    await show(2250);
    expect(screen.getByLabelText('2,25 de 2 litros')).toBeTruthy();
  });

  it('the toast "Desfazer" undoes the last sip (FR-003)', async () => {
    await show(250);
    await act(async () => {
      useWotahStore.setState({ undoToastKey: 1 });
    });
    await fireEvent.press(await screen.findByText('Desfazer'));
    expect(mockUndoLastSip).toHaveBeenCalled();
  });
});
