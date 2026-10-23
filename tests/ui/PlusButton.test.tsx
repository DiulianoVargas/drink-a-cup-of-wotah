import { fireEvent, render, screen } from '@testing-library/react-native';
import { LONG_PRESS_MS, PlusButton } from '@/ui/components/PlusButton';

describe('PlusButton (FR-002, FR-003)', () => {
  it('a tap logs a sip', async () => {
    const onPress = jest.fn();
    await render(<PlusButton onPress={onPress} onUndo={jest.fn()} canUndo />);
    await fireEvent.press(screen.getByLabelText('Registrar um copo de 250 ml'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a long press opens "Desfazer último gole" and undoes', async () => {
    const onUndo = jest.fn();
    await render(<PlusButton onPress={jest.fn()} onUndo={onUndo} canUndo />);
    expect(screen.queryByText('Desfazer último gole')).toBeNull();
    await fireEvent(screen.getByLabelText('Registrar um copo de 250 ml'), 'longPress');
    await fireEvent.press(screen.getByText('Desfazer último gole'));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Desfazer último gole')).toBeNull();
  });

  it('the undo option is disabled at 0 ml (AS-1.4)', async () => {
    const onUndo = jest.fn();
    await render(<PlusButton onPress={jest.fn()} onUndo={onUndo} canUndo={false} />);
    await fireEvent(screen.getByLabelText('Registrar um copo de 250 ml'), 'longPress');
    await fireEvent.press(screen.getByText('Desfazer último gole'));
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('uses a 0.45 s long-press delay (design: Telas › Segurando o "+")', () => {
    expect(LONG_PRESS_MS).toBe(450);
  });
});
