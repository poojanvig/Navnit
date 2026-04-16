import { View, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../lib/theme";

const TAB_BAR_HEIGHT = 68;
const TAB_BAR_MARGIN = 16; // extra breathing room above tab bar

interface ScreenProps {
  children: React.ReactNode;
  /** Whether this screen sits behind a floating tab bar (default: true) */
  hasTabs?: boolean;
  style?: ViewStyle;
}

export default function Screen({ children, hasTabs = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: hasTabs
            ? TAB_BAR_HEIGHT + TAB_BAR_MARGIN + Math.max(insets.bottom, 8)
            : insets.bottom + spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
});
