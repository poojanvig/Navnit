import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>profile</Text>

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name || "Unknown"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/add-portfolio")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.purpleDim }]}>
                <Text style={[styles.menuIconText, { color: colors.purple }]}>+</Text>
              </View>
              <Text style={styles.menuText}>link new portfolio</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.errorDim }]}>
                <Text style={[styles.menuIconText, { color: colors.error }]}>↗</Text>
              </View>
              <Text style={[styles.menuText, { color: colors.error }]}>logout</Text>
            </View>
            <Text style={[styles.menuArrow, { color: colors.error }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>navnit</Text>
          <Text style={styles.footerVersion}>v1.0.0 · mvp</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: 60 },
  pageTitle: {
    fontSize: fontSize.xl,
    fontWeight: "200",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "lowercase",
    marginBottom: spacing.xl,
  },

  avatarCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlass,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: "100",
    color: colors.text,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "200",
    color: colors.text,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },

  menu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconText: {
    fontSize: fontSize.lg,
    fontWeight: "300",
  },
  menuText: {
    fontSize: fontSize.md,
    color: colors.text,
    letterSpacing: 0.5,
    fontWeight: "300",
  },
  menuArrow: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  footer: {
    alignItems: "center",
    marginTop: spacing.xxxl,
    gap: 4,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 6,
    textTransform: "lowercase",
  },
  footerVersion: {
    fontSize: fontSize.xxs,
    color: colors.textMuted,
    letterSpacing: 2,
  },
});
