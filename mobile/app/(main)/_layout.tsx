import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, borderRadius } from "../../lib/theme";

function TabIcon({
  focused,
  icon,
}: {
  focused: boolean;
  icon: "dashboard" | "holdings" | "profile";
}) {
  const content = (() => {
    if (icon === "dashboard") {
      return (
        <View style={styles.gridIcon}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.gridSquare,
                focused && styles.gridSquareActive,
              ]}
            />
          ))}
        </View>
      );
    }
    if (icon === "holdings") {
      return (
        <View style={styles.barChart}>
          <View style={[styles.bar, { height: 8 }, focused && styles.barActive]} />
          <View style={[styles.bar, { height: 14 }, focused && styles.barActive]} />
          <View style={[styles.bar, { height: 11 }, focused && styles.barActive]} />
          <View style={[styles.bar, { height: 18 }, focused && styles.barActive]} />
        </View>
      );
    }
    return (
      <View style={styles.personIcon}>
        <View style={[styles.personHead, focused && styles.personActive]} />
        <View style={[styles.personBody, focused && styles.personActive]} />
      </View>
    );
  })();

  return (
    <View style={styles.iconOuter}>
      {focused && <View style={styles.activePill} />}
      {content}
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const bottomOffset =
    Platform.OS === "web"
      ? 16
      : Math.max(insets.bottom + 8, Platform.OS === "android" ? 16 : 24);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: bottomOffset,
          left: 20,
          right: 20,
          height: 68,
          backgroundColor: "rgba(12,10,6,0.94)",
          borderRadius: borderRadius.xxl,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.brandBorder,
          paddingBottom: 0,
          paddingTop: 0,
          ...Platform.select({
            web: {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            } as any,
            default: {},
          }),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
          elevation: 20,
        },
        tabBarItemStyle: {
          paddingVertical: 12,
          minHeight: 48,
        },
        tabBarActiveTintColor: colors.brandBright,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1.5,
          fontWeight: "600",
          textTransform: "uppercase" as any,
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== "web") {
            Haptics.selectionAsync();
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarAccessibilityLabel: "Dashboard tab",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="dashboard" />
          ),
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: "Holdings",
          tabBarAccessibilityLabel: "Holdings tab",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="holdings" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile tab",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconOuter: {
    width: 44,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  // Active pill background behind icon
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brandDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },

  // Top indicator — small gold dot above the icon when focused
  activeIndicator: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },

  // Dashboard: 2x2 grid
  gridIcon: {
    width: 20,
    height: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  gridSquare: {
    width: 8,
    height: 8,
    borderRadius: 2.5,
    backgroundColor: colors.textTertiary,
  },
  gridSquareActive: {
    backgroundColor: colors.brandBright,
  },

  // Holdings: bar chart
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 20,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
  },
  barActive: {
    backgroundColor: colors.brandBright,
  },

  // Profile: person
  personIcon: {
    alignItems: "center",
    gap: 2,
  },
  personHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  personBody: {
    width: 14,
    height: 8,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: colors.textTertiary,
  },
  personActive: {
    backgroundColor: colors.brandBright,
  },
});
