import * as Haptics from 'expo-haptics';

const ignore = () => {};

/** Light tap on every sip (research R9). */
export const sipHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
};

/** Success pattern when the goal is met. */
export const goalHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
};
