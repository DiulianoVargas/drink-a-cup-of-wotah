import { createLiveActivity } from 'expo-widgets';
import '@/widgets/WotahDay';

/** The widgets Babel plugin may escape non-ASCII characters (\uXXXX, \xXX) in the generated source. */
const decoded = (source: string) =>
  source
    .replace(/\\u([0-9a-f]{4})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));

describe('WotahDay Live Activity', () => {
  it('is registered as "WotahDay" and compiled to an isolated widget function', () => {
    const [name, layout] = (createLiveActivity as jest.Mock).mock.calls[0];
    expect(name).toBe('WotahDay');
    // babel-preset-expo's widgets plugin turns the 'widget' function into source text.
    expect(typeof layout).toBe('string');
  });

  it('defines every region and uses the namespaced "Bebi 💧" target', () => {
    const layout = decoded((createLiveActivity as jest.Mock).mock.calls[0][1]);
    for (const region of [
      'banner',
      'compactLeading',
      'compactTrailing',
      'minimal',
      'expandedLeading',
      'expandedTrailing',
      'expandedBottom',
    ]) {
      expect(layout).toContain(region);
    }
    expect(layout).toContain('wotah-drink');
    expect(layout).toContain('Bom trabalho! 🎉');
    expect(layout).toContain('Meta de hoje batida. Lembretes só amanhã!');
  });

  it('contains no business rule (expression/goal thresholds come from the domain)', () => {
    const layout: string = (createLiveActivity as jest.Mock).mock.calls[0][1];
    expect(layout).not.toMatch(/0\.25|\* ?4|expressionFor/);
  });
});
