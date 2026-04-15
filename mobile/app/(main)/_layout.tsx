import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors, borderRadius } from "../../lib/theme";

function TabIcon({
  focused,
  icon,
}: {
  focused: boolean;
  icon: "dashboard" | "holdings" | "profile";
}) {
  // Dashboard: 4-square grid
  if (icon === "dashboard") {
    return (
      <View style={styles.iconOuter}>
        {focused && <View style={styles.glowDot} />}
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
      </View>
    );
  }

  // Holdings: bar chart
  if (icon === "holdings") {
    return (
      <View style={styles.iconOuter}>
        {focused && <View style={styles.glowDot} />}
        <View style={styles.barChart}>
          <View style={[styles.bar, { height: 8 }, focused && styles.barActive]} />
          <View style={[styles.bar, { height: 14 }, focused && styles.barActive]} />
          <View style={[styles.bar, { height: 11 }, focused && styles.barActive]} />
          <View style={[styles.bar, { height: 18 }, focused && styles.barActive]} />
        </View>
      </View>
    );
  }

  // Profile: person silhouette
  return (
    <View style={styles.iconOuter}>
      {focused && <View style={styles.glowDot} />}
      <View style={styles.personIcon}>
        <View style={[styles.personHead, focused && styles.personActive]} />
        <View style={[styles.personBody, focused && styles.personActive]} />
      </View>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "web" ? 16 : 24,
          left: 20,
          right: 20,
          height: 68,
          backgroundColor: "rgba(15,17,20,0.94)",
          borderRadius: borderRadius.xxl,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
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
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1.5,
          fontWeight: "500",
          textTransform: "uppercase" as any,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="dashboard" />
          ),
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: "Holdings",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="holdings" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Icon container
  iconOuter: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // Active glow dot above icon
  glowDot: {
    position: "absolute",
    top: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.accent,
  },
});
