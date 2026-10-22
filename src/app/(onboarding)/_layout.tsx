import { Stack } from 'expo-router';
import { useTheme } from '@/ui/theme/useTheme';

export const unstable_settings = { initialRouteName: 'weight' };

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
