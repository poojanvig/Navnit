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
