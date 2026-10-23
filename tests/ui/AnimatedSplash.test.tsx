import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplash } from '@/ui/components/AnimatedSplash';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hide: jest.fn(),
  hideAsync: jest.fn(async () => undefined),
}));

let mockReduceMotion = false;
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: () => mockReduceMotion,
}));

const LABEL = 'Wotah, carregando';
const MIN_VISIBLE_MS = 900;
const EXIT_MS = 280;

/** Simulates the first native layout pass (screen, then the mascot wrapper). */
async function layOut() {
  await act(async () => {
    fireEvent(screen.getByLabelText(LABEL), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 852 } },
    });
    fireEvent(screen.getByTestId('splash-mascot', { includeHiddenElements: true }), 'layout', {
      nativeEvent: { layout: { x: 106, y: 234, width: 180, height: 222 } },
    });
  });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('AnimatedSplash (FR-035, contracts/splash.md)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(SplashScreen.hide).mockClear();
  });
  afterEach(() => jest.useRealTimers());

  describe.each([
    ['full motion', false],
    ['Reduce Motion', true],
  ])('%s', (_, reduced) => {
    beforeEach(() => {
      mockReduceMotion = reduced;
    });

    it('is announced as a single PT-BR element', async () => {
      await render(<AnimatedSplash ready={false} onDone={jest.fn()} />);
      expect(screen.getByLabelText(LABEL)).toBeTruthy();
    });

    it('hides the native splash once, after the first layout', async () => {
      await render(<AnimatedSplash ready={false} onDone={jest.fn()} />);
      expect(SplashScreen.hide).not.toHaveBeenCalled();
      await layOut();
      await advance(50);
      expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
      await layOut();
      await advance(50);
      expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    });

    it('stays at least 900 ms even when the app is ready at mount, then fades out once', async () => {
      const onDone = jest.fn();
      await render(<AnimatedSplash ready onDone={onDone} />);
      await layOut();
      await advance(MIN_VISIBLE_MS - 10);
      expect(onDone).not.toHaveBeenCalled();
      await advance(10); // the minimum is reached; the exit fade starts on that render
      await advance(EXIT_MS + 50);
      expect(onDone).toHaveBeenCalledTimes(1);
      await advance(5000);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('waits for ready, then leaves after the exit fade', async () => {
      const onDone = jest.fn();
      const { rerender } = await render(<AnimatedSplash ready={false} onDone={onDone} />);
      await layOut();
      await advance(3000);
      expect(onDone).not.toHaveBeenCalled();
      await rerender(<AnimatedSplash ready onDone={onDone} />);
      await advance(EXIT_MS - 30);
      expect(onDone).not.toHaveBeenCalled();
      await advance(80);
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
