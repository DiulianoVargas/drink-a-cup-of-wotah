import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Home from '@/app/(main)/index';
import { useWotahStore } from '@/state/store';
import { PROFILE } from '../helpers/fakes';

const mockRegisterSip = jest.fn(async () => null);
const mockSetParams = jest.fn();
let mockParams: { sip?: string } = {};
jest.mock('@/usecases/container', () => ({
  getApp: () => ({ registerSip: mockRegisterSip, undoLastSip: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => mockParams,
  router: { setParams: (p: unknown) => mockSetParams(p) },
}));

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const show = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Home />
    </SafeAreaProvider>,
  );

describe('Live Activity tap without interactive button (iOS < 17, T082)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWotahStore.setState({
      ready: true,
      profile: PROFILE,
      today: { dayKey: '2026-10-22', goalMl: 2000, consumedMl: 500, lastSipAt: null },
      permission: 'granted',
    });
  });

  it('wotah:///?sip=1 logs exactly one sip with the toast and drops the param', async () => {
    mockParams = { sip: '1' };
    await show();
    expect(mockRegisterSip).toHaveBeenCalledTimes(1);
    expect(mockRegisterSip).toHaveBeenCalledWith('live_activity', {
      eventKey: expect.stringMatching(/^la-tap:/),
      showUndoToast: true,
    });
    expect(mockSetParams).toHaveBeenCalledWith({ sip: undefined });
  });

  it('without the param nothing is logged', async () => {
    mockParams = {};
    await show();
    expect(mockRegisterSip).not.toHaveBeenCalled();
  });
});
