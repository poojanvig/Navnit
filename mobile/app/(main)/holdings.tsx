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
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

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
        <ActivityIndicator color={colors.textSecondary} />
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Holdings</Text>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "mf" && styles.tabActive]}
          onPress={() => setTab("mf")}
        >
          <Text style={[styles.tabText, tab === "mf" && styles.tabTextActive]}>
            Mutual Funds ({schemes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "demat" && styles.tabActive]}
          onPress={() => setTab("demat")}
        >
          <Text
            style={[styles.tabText, tab === "demat" && styles.tabTextActive]}
          >
            Demat ({demat.length})
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
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {name}
                    </Text>
                    <Text style={styles.cardSub}>
                      {s.amc} · {s.type}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.cardValue}>{fmtINR(s.value || 0)}</Text>
                    <Text
                      style={[
                        styles.cardGain,
                        { color: gain >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {gain >= 0 ? "+" : ""}
                      {fmtINR(gain)} ({gainPct >= 0 ? "+" : ""}
                      {gainPct.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Units</Text>
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
                    <Text style={styles.detailLabel}>Invested</Text>
                    <Text style={styles.detailValue}>
                      {fmtINR(s.cost || 0)}
                    </Text>
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
            ...( holdings.equities || []),
            ...(holdings.demat_mutual_funds || []),
            ...(holdings.corporate_bonds || []),
            ...(holdings.government_securities || []),
            ...(holdings.aifs || []),
          ];
          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{dp}</Text>
                  <Text style={styles.cardSub}>
                    BO: {acct.bo_id} ·{" "}
                    {acct.additional_info?.status || "N/A"}
                  </Text>
                </View>
                <Text style={styles.cardValue}>
                  {fmtINR(acct.value || 0)}
                </Text>
              </View>
              {allSec.length > 0 && (
                <View style={styles.cardDetails}>
                  {allSec.map((sec: any, j: number) => {
                    const secName = sec.name?.includes("#")
                      ? sec.name.split("#").pop()
                      : sec.name;
                    return (
                      <View key={j} style={styles.secRow}>
                        <Text style={styles.secName} numberOfLines={1}>
                          {secName}
                        </Text>
                        <Text style={styles.detailValue}>
                          {sec.units} units · {fmtINR(sec.value || 0)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
              {allSec.length === 0 && (
                <Text style={styles.emptySec}>No holdings</Text>
              )}
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
    paddingBottom: 100,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "300",
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  tabTextActive: {
    color: colors.bg,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "400",
    lineHeight: 20,
  },
  cardSub: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  cardValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "500",
  },
  cardGain: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  cardDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  secRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  secName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    marginRight: spacing.sm,
  },
  emptySec: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});
