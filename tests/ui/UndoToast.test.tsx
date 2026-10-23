import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { UndoToast } from '@/ui/components/UndoToast';

describe('UndoToast (FR-003)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is hidden until a sip requests it', async () => {
    await render(<UndoToast showKey={0} onUndo={jest.fn()} />);
    expect(screen.queryByText('Desfazer')).toBeNull();
  });

  it('appears after a sip and hides itself after 4 s', async () => {
    const { rerender } = await render(<UndoToast showKey={0} onUndo={jest.fn()} />);
    await rerender(<UndoToast showKey={1} onUndo={jest.fn()} />);
    expect(screen.getByText('Desfazer')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(3900);
    });
    expect(screen.getByText('Desfazer')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Desfazer')).toBeNull();
  });

  it('a new sip restarts the 4 s window', async () => {
    const { rerender } = await render(<UndoToast showKey={1} onUndo={jest.fn()} />);
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await rerender(<UndoToast showKey={2} onUndo={jest.fn()} />);
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Desfazer')).toBeTruthy();
  });

  it('"Desfazer" undoes and closes the toast', async () => {
    const onUndo = jest.fn();
    await render(<UndoToast showKey={1} onUndo={onUndo} />);
    await fireEvent.press(screen.getByText('Desfazer'));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Desfazer')).toBeNull();
  });
});
