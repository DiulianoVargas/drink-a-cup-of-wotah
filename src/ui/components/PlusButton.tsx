import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MAX_FONT_SCALE, typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

export const LONG_PRESS_MS = 450;
const SIZE = 92;

type Props = {
  onPress: () => void;
  onUndo: () => void;
  /** False at 0 ml: the undo option is shown disabled (AS-1.4). */
  canUndo: boolean;
  /** Subtitle of the undo option, e.g. "Volta pra 1,25 L". */
  undoHint?: string;
};

/** The big "+" (FR-002). Long press (0.45 s) offers "Desfazer último gole" (FR-003). */
export function PlusButton({ onPress, onUndo, canUndo, undoHint }: Props) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          accessibilityLabel="Fechar"
          onPress={() => setMenuOpen(false)}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        />
        <View pointerEvents="box-none" style={styles.menuAnchor}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canUndo }}
            accessibilityHint={undoHint}
            onPress={() => {
              setMenuOpen(false);
              if (canUndo) onUndo();
            }}
            style={({ pressed }) => [
              styles.menu,
              {
                backgroundColor: pressed && canUndo ? colors.surface2 : colors.surface,
                opacity: canUndo ? 1 : 0.45,
              },
            ]}
          >
            <UndoIcon color={colors.ink} />
            <View style={styles.menuText}>
              <Text
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[typography.button, styles.menuTitle, { color: colors.ink }]}
              >
                Desfazer último gole
              </Text>
              {undoHint ? (
                <Text
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                  style={[typography.caption, { color: colors.ink2 }]}
                >
                  {undoHint}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </View>
      </Modal>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar um copo de 250 ml"
        accessibilityHint="Segure para desfazer o último gole"
        delayLongPress={LONG_PRESS_MS}
        onPress={onPress}
        onLongPress={() => setMenuOpen(true)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.plusButton,
            borderColor: colors.surface,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <Svg width={40} height={40} viewBox="0 0 24 24">
          <Path
            d="M12 5v14M5 12h14"
            stroke={colors.onWater}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[typography.caption, styles.hint, { color: colors.ink2 }]}
      >
        Toque: +1 copo · Segure: desfazer
      </Text>
    </View>
  );
}

function UndoIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"
        stroke={color}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  button: {
    width: SIZE + 12,
    height: SIZE + 12,
    borderRadius: (SIZE + 12) / 2,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4696B4',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 14 },
  },
  hint: { marginTop: 2 },
  menuAnchor: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 262,
  },
  menu: {
    width: 270,
    minHeight: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuText: { gap: 1, flexShrink: 1 },
  menuTitle: { fontSize: 16 },
});
