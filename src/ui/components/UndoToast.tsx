import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

const VISIBLE_MS = 4000;

type Props = {
  /** Incremented by every sip that should show the toast; 0 = never shown. */
  showKey: number;
  onUndo: () => void;
};

/** "Desfazer" toast shown for 4 s after each sip (FR-003). Inverted colors in dark mode. */
export function UndoToast({ showKey, onUndo }: Props) {
  const { colors } = useTheme();
  const [dismissedKey, setDismissedKey] = useState(0);
  const visible = showKey > 0 && showKey !== dismissedKey;

  useEffect(() => {
    if (showKey === 0) return;
    const timer = setTimeout(() => setDismissedKey(showKey), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [showKey]);

  if (!visible) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.toast, { backgroundColor: colors.toastBg }]}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        numberOfLines={1}
        style={[typography.button, { color: colors.toastInk, flex: 1 }]}
      >
        +250 ml registrado 💧
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Remove o último gole"
        hitSlop={8}
        onPress={() => {
          setDismissedKey(showKey);
          onUndo();
        }}
        style={[styles.action, { backgroundColor: 'rgba(159,216,234,0.22)' }]}
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.button, { color: colors.toastInk }]}
        >
          Desfazer
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingLeft: 18,
    paddingRight: 8,
    minHeight: 58,
    shadowColor: '#142834',
    shadowOpacity: 0.45,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 16 },
  },
  action: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 15,
    justifyContent: 'center',
  },
});
