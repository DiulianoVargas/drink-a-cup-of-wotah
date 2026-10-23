import { Stack } from 'expo-router';
import { useTheme } from '@/ui/theme/useTheme';

export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
