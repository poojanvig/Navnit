/**
 * Indian ₹ formatting with lakhs/crores grouping.
 */

/** Abbreviated: ₹12.4L, ₹1.25Cr */
export function fmtINR(v: number): string {
  if (v === undefined || v === null) return "₹0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 10_000_000)
    return `${sign}₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(2)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Full format: ₹1,23,456 */
export function fmtINRFull(v: number): string {
  if (v === undefined || v === null) return "₹0";
  return `₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Currency style: ₹1,23,456 via Intl */
export function fmtCurrency(v: number): string {
  return (
    v?.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) ?? "₹0"
  );
}

/** Relative time: "just now", "5m ago", "2h ago", "Apr 18" */
export function fmtRelativeTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 45) return "just now";
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.round(secs / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
