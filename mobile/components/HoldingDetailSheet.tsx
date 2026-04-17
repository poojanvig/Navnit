import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fmtINR, fmtCurrency } from "../lib/format";
import { StatPill } from "./StatPill";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  tabular,
  cardShadow,
} from "../lib/theme";

export interface HoldingTransaction {
  type: string;
  units?: number;
  nav?: number;
  amount: number;
  date: string;
}

export interface HoldingDetail {
  name: string;
  sub?: string;
  type: string;
  units?: number;
  nav?: number;
  value: number;
  cost?: number;
  gainAbs?: number;
  gainPct?: number;
  transactions?: HoldingTransaction[];
}

export interface HoldingDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  holding: HoldingDetail | null;
}

export function HoldingDetailSheet({
  visible,
  onClose,
  holding,
}: HoldingDetailSheetProps) {
  const insets = useSafeAreaInsets();

  if (!holding) return null;

  const hasGain =
    typeof holding.gainAbs === "number" && typeof holding.cost === "number";
  const gain = holding.gainAbs || 0;
  const gainPct = holding.gainPct || 0;

  const txs = holding.transactions || [];

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === "web" ? "fade" : "slide"}
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <View style={styles.grabber} />

        <ScrollView
          style={{ maxHeight: "100%" }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <View style={styles.typeChipWrap}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{holding.type}</Text>
                </View>
                {holding.sub && (
                  <Text style={styles.sub} numberOfLines={1}>
                    {holding.sub}
                  </Text>
                )}
              </View>
              <Text style={styles.name} numberOfLines={3}>
                {holding.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueLabel}>CURRENT VALUE</Text>
            <Text style={styles.valueAmount}>{fmtINR(holding.value)}</Text>
            {hasGain && <StatPill pct={gainPct} size="md" style={{ marginTop: 8 }} />}
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>UNITS</Text>
              <Text style={styles.statValue}>
                {holding.units != null
                  ? holding.units.toLocaleString("en-IN", {
                      maximumFractionDigits: 3,
                    })
                  : "—"}
              </Text>
            </View>
            {holding.nav != null && (
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>NAV</Text>
                <Text style={styles.statValue}>₹{holding.nav.toFixed(2)}</Text>
              </View>
            )}
            {holding.cost != null && (
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>INVESTED</Text>
                <Text style={styles.statValue}>{fmtCurrency(holding.cost)}</Text>
              </View>
            )}
            {hasGain && (
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>P&L</Text>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        gain >= 0 ? colors.successBright : colors.errorBright,
                    },
                  ]}
                >
                  {gain >= 0 ? "+" : ""}
                  {fmtCurrency(gain)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.txHeader}>
            <Text style={styles.sectionLabel}>Transactions</Text>
            {txs.length > 0 && (
              <Text style={styles.txCount}>{txs.length}</Text>
            )}
          </View>

          {txs.length === 0 ? (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>
                No transactions available
              </Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {txs.map((t, i) => {
                const isBuy = t.type?.toUpperCase() === "PURCHASE";
                const sign = isBuy ? "+" : "−";
                return (
                  <View key={i} style={styles.txRow}>
                    <View
                      style={[
                        styles.txTypeBadge,
                        {
                          backgroundColor: isBuy
                            ? colors.successDim
                            : colors.errorDim,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.txTypeText,
                          {
                            color: isBuy
                              ? colors.successBright
                              : colors.errorBright,
                          },
                        ]}
                      >
                        {t.type}
                      </Text>
                    </View>
                    <View style={styles.txMid}>
                      <Text style={styles.txDate}>{t.date}</Text>
                      {(t.units != null || t.nav != null) && (
                        <Text style={styles.txMeta}>
                          {t.units != null
                            ? `${t.units.toLocaleString("en-IN", {
                                maximumFractionDigits: 3,
                              })} units`
                            : ""}
                          {t.units != null && t.nav != null ? " · " : ""}
                          {t.nav != null ? `₹${t.nav.toFixed(2)} NAV` : ""}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: isBuy
                            ? colors.successBright
                            : colors.errorBright,
                        },
                      ]}
                    >
                      {sign} {fmtCurrency(t.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderLight,
    ...cardShadow,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  typeChipWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.brandDim,
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.brandBright,
    letterSpacing: 0.8,
  },
  sub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    flexShrink: 1,
  },
  name: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: "600",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  valueCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  valueLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  valueAmount: {
    fontSize: 30,
    color: colors.text,
    fontWeight: "400",
    letterSpacing: -0.8,
    marginTop: 6,
    ...tabular,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCell: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  txHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  txCount: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: "700",
    ...tabular,
  },
  emptyTx: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyTxText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  txList: {
    gap: spacing.sm,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  txTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  txTypeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  txMid: {
    flex: 1,
    gap: 2,
  },
  txDate: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  txMeta: {
    fontSize: 10,
    color: colors.textTertiary,
    ...tabular,
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    ...tabular,
  },
});
