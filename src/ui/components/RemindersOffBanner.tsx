import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = {
  /** 'permission': denied in iOS Settings; 'app': turned off in Wotah's Ajustes. */
  reason: 'permission' | 'app';
  onActivate: () => void;
};

/** Discreet notice when reminders are off (AS-2.4). Manual logging keeps working. */
export function RemindersOffBanner({ reason, onActivate }: Props) {
  const { colors } = useTheme();
  const text =
    reason === 'permission'
      ? 'Lembretes desligados. Pra ativar: Ajustes do iPhone › Notificações › Wotah.'
      : 'Lembretes desligados nos Ajustes do Wotah.';
  return (
    <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path
          d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0M3 3l18 18"
          stroke={colors.ink2}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.text, { color: colors.ink2 }]}>
        {text}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ativar lembretes"
        onPress={onActivate}
        hitSlop={8}
        style={[styles.action, { backgroundColor: colors.surface2 }]}
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[typography.button, { color: colors.ink, fontSize: 13 }]}
        >
          Ativar
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginHorizontal: 20,
  },
  text: { ...typography.caption, flex: 1, lineHeight: 17 },
  action: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
});
