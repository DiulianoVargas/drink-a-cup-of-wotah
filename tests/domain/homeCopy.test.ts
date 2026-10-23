import { homeCopy, mascotLabel, undoMenuHint } from '@/domain/homeCopy';
import { hm } from '../helpers/time';

const bedtime = hm(22);

describe('homeCopy (design/Wotah Telas.html › Home)', () => {
  it.each([
    [0, 2000, 'Bom dia! Bora começar com um golinho?', '8 copos de 250 ml até as 22h'],
    [250, 2000, 'Que bom, já começou!', 'Faltam 7 copos pra meta'],
    [1000, 2000, 'Tá indo muito bem!', 'Faltam 4 copos pra meta'],
    [1750, 2000, 'Tá indo muito bem!', 'Falta só 1 copo pra meta'],
    [2000, 2000, 'Bom trabalho! 🎉', 'Você bateu a meta de hoje'],
    [2250, 2000, 'Bom trabalho! 🎉', 'Meta batida e mais 250 ml de bônus'],
    [3000, 2000, 'Bom trabalho! 🎉', 'Meta batida e mais 1.000 ml de bônus'],
  ])('%i / %i ml → "%s" · "%s"', (consumed, goal, message, sub) => {
    expect(homeCopy(consumed, goal, bedtime)).toEqual({ message, sub });
  });

  it('formats a bedtime with minutes', () => {
    expect(homeCopy(0, 2000, hm(23, 30)).sub).toBe('8 copos de 250 ml até as 23h30');
  });
});

describe('undoMenuHint', () => {
  it.each([
    [0, 'Nada pra desfazer ainda'],
    [250, 'Volta pra 0 L'],
    [1500, 'Volta pra 1,25 L'],
  ])('%i ml → %s', (consumed, expected) => {
    expect(undoMenuHint(consumed)).toBe(expected);
  });
});

describe('mascotLabel (VoiceOver, research R14)', () => {
  it.each([
    [0, 2000, 'Garrafa com 0 de 2 litros, com sede'],
    [1250, 2000, 'Garrafa com 1,25 de 2 litros, animada'],
    [2000, 2000, 'Garrafa com 2 de 2 litros, radiante'],
    [2250, 2000, 'Garrafa com 2,25 de 2 litros, comemorando'],
  ])('%i / %i ml → %s', (consumed, goal, expected) => {
    expect(mascotLabel(consumed, goal)).toBe(expected);
  });
});
