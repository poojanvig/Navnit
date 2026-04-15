import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { getPortfolios, getPortfolio } from "../../lib/api";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  tabular,
  cardShadow,
} from "../../lib/theme";

export default function Holdings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mf" | "demat">("mf");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const list = await getPortfolios();
          if (list.length > 0) {
            const d = await getPortfolio(list[0].id);
            setData(d);
          }
        } catch {
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const fmtINR = (v: number) =>
    v?.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) ?? "₹0";

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>No holdings data</Text>
      </View>
    );
  }

  const mf = data.mutual_funds || [];
  const demat = data.demat_accounts || [];

  const schemes: any[] = [];
  mf.forEach((folio: any) => {
    folio.schemes?.forEach((s: any) => {
      schemes.push({ ...s, amc: folio.amc, folio: folio.folio_number });
    });
  });

  const accentColor = tab === "mf" ? colors.accent : colors.violet;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Holdings</Text>
        <Text style={styles.subtitle}>
          {schemes.length + demat.length} instruments across {mf.length + demat.length} accounts
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            tab === "mf" && [
              styles.tabActive,
              { borderColor: colors.borderGlow, backgroundColor: colors.accentDim },
            ],
          ]}
          onPress={() => setTab("mf")}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.tabDot,
              { backgroundColor: tab === "mf" ? colors.accent : colors.textTertiary },
            ]}
          />
          <Text
            style={[
              styles.tabText,
              tab === "mf" && { color: colors.text, fontWeight: "600" },
            ]}
          >
            Mutual Funds
          </Text>
          <Text
            style={[
              styles.tabCount,
              tab === "mf" && { color: colors.accent },
            ]}
          >
            {schemes.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            tab === "demat" && [
              styles.tabActive,
              { borderColor: colors.borderViolet, backgroundColor: colors.violetDim },
            ],
          ]}
          onPress={() => setTab("demat")}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.tabDot,
              {
                backgroundColor:
                  tab === "demat" ? colors.violet : colors.textTertiary,
              },
            ]}
          />
          <Text
            style={[
              styles.tabText,
              tab === "demat" && { color: colors.text, fontWeight: "600" },
            ]}
          >
            Demat
          </Text>
          <Text
            style={[
              styles.tabCount,
              tab === "demat" && { color: colors.violetBright },
            ]}
          >
            {demat.length}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "mf" &&
        schemes
          .sort((a, b) => (b.value || 0) - (a.value || 0))
          .map((s, i) => {
            const gain = s.gain?.absolute || 0;
            const gainPct = s.gain?.percentage || 0;
            const name = s.name?.includes(" - ")
              ? s.name.split(" - ").pop()
              : s.name;
            return (
              <View key={i} style={styles.card}>
                <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text style={styles.cardName} numberOfLines={2}>
                        {name}
                      </Text>
                      <View style={styles.cardSubRow}>
                        <View
                          style={[
                            styles.typeChip,
                            { backgroundColor: colors.accentDim },
                          ]}
                        >
                          <Text style={[styles.typeChipText, { color: colors.accent }]}>
                            {s.type}
                          </Text>
                        </View>
                        <Text style={styles.cardSub} numberOfLines={1}>
                          {s.amc}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.cardValue}>{fmtINR(s.value || 0)}</Text>
                      <View
                        style={[
                          styles.gainPill,
                          {
                            backgroundColor:
                              gain >= 0 ? colors.successDim : colors.errorDim,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gainPillText,
                            {
                              color: gain >= 0 ? colors.successBright : colors.errorBright,
                            },
                          ]}
                        >
                          {gain >= 0 ? "▲" : "▼"} {Math.abs(gainPct).toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>UNITS</Text>
                      <Text style={styles.detailValue}>
                        {s.units?.toFixed(3)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>NAV</Text>
                      <Text style={styles.detailValue}>
                        ₹{s.nav?.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>INVESTED</Text>
                      <Text style={styles.detailValue}>{fmtINR(s.cost || 0)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>P&L</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              gain >= 0 ? colors.successBright : colors.errorBright,
                          },
                        ]}
                      >
                        {gain >= 0 ? "+" : ""}
                        {fmtINR(gain)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

      {tab === "demat" &&
        demat.map((acct: any, i: number) => {
          const dp = acct.dp_name || "Unknown";
          const holdings = acct.holdings || {};
          const allSec = [
            ...(holdings.equities || []),
            ...(holdings.demat_mutual_funds || []),
            ...(holdings.corporate_bonds || []),
            ...(holdings.government_securities || []),
            ...(holdings.aifs || []),
          ];
          return (
            <View key={i} style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: colors.violet }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text style={styles.cardName}>{dp}</Text>
                    <Text style={styles.cardSub}>
                      BO · {acct.bo_id}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.cardValue}>{fmtINR(acct.value || 0)}</Text>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: colors.violetDim },
                      ]}
                    >
                      <Text style={[styles.statusChipText, { color: colors.violetBright }]}>
                        {(acct.additional_info?.status || "ACTIVE").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                {allSec.length > 0 ? (
                  <View style={styles.secList}>
                    {allSec.map((sec: any, j: number) => {
                      const secName = sec.name?.includes("#")
                        ? sec.name.split("#").pop()
                        : sec.name;
                      return (
                        <View key={j} style={styles.secRow}>
                          <View style={styles.secLeft}>
                            <View style={styles.secBullet} />
                            <Text style={styles.secName} numberOfLines={1}>
                              {secName}
                            </Text>
                          </View>
                          <View style={styles.secRight}>
                            <Text style={styles.secUnits}>{sec.units} units</Text>
                            <Text style={styles.secValue}>
                              {fmtINR(sec.value || 0)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptySec}>No holdings in this account</Text>
                )}
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {},
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  tabCount: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: "700",
    ...tabular,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...cardShadow,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
    lineHeight: 20,
  },
  cardSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  typeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
  },
  cardValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  gainPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: 4,
  },
  gainPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    ...tabular,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Details grid
  cardDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    gap: 3,
  },
  detailLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },

  // Demat securities list
  secList: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  secRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  secBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.violet,
  },
  secName: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  secRight: {
    alignItems: "flex-end",
  },
  secUnits: {
    fontSize: 10,
    color: colors.textTertiary,
    ...tabular,
  },
  secValue: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  emptySec: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
