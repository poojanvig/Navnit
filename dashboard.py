"""Navnit — Investment Portfolio Dashboard powered by CASParser data."""

import json
import os
from datetime import datetime
from pathlib import Path

import httpx
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Navnit — Portfolio Dashboard", page_icon="📊", layout="wide")
BASE_URL = "https://api.casparser.in"
DATA_DIR = Path(".")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fmt_inr(value):
    if value is None:
        return "₹0"
    sign = "-" if value < 0 else ""
    value = abs(value)
    return f"{sign}₹{value:,.2f}"


def load_json(path):
    return json.loads(Path(path).read_text())


def save_json(data, prefix):
    filename = DATA_DIR / f"response_{prefix}_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.json"
    filename.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    return filename


def api_headers():
    key = os.getenv("CASPARSER_API_KEY", "")
    return {"x-api-key": key}


# ---------------------------------------------------------------------------
# Aggregation engine — merge all JSON files for the same PAN
# ---------------------------------------------------------------------------

def load_all_parsed_responses():
    """Load every valid CAS response JSON from disk."""
    results = []
    for pattern in ["response_cdsl_parsed_*.json", "response_smart_parse_*.json",
                     "response_cdsl_all_parsed_*.json"]:
        for f in DATA_DIR.glob(pattern):
            try:
                data = load_json(f)
                # all_parsed files contain a list
                if isinstance(data, list):
                    results.extend(data)
                elif isinstance(data, dict) and "investor" in data:
                    results.append(data)
            except Exception:
                continue
    return results


def aggregate_by_pan(responses):
    """Group responses by PAN and merge into one unified portfolio per investor."""
    pan_groups = {}
    for r in responses:
        pan = r.get("investor", {}).get("pan", "UNKNOWN")
        pan_groups.setdefault(pan, []).append(r)

    aggregated = {}
    for pan, group in pan_groups.items():
        aggregated[pan] = merge_responses(group)
    return aggregated


def merge_responses(responses):
    """Merge multiple CAS responses into one unified view.

    - Demat accounts: deduplicate by bo_id, keep the one with highest value
    - Mutual fund folios: deduplicate by folio_number, keep the one with most schemes/value
    - Investor: take from the response with most data
    - Meta: track all statement periods covered
    """
    # Sort by generated_at descending so latest comes first
    responses.sort(
        key=lambda r: r.get("meta", {}).get("generated_at", ""),
        reverse=True,
    )

    base = responses[0]
    merged = {
        "investor": base.get("investor", {}),
        "meta": {
            "cas_type": "AGGREGATED",
            "generated_at": datetime.now().isoformat(),
            "statements_merged": len(responses),
            "periods_covered": [],
        },
        "demat_accounts": [],
        "mutual_funds": [],
        "insurance": base.get("insurance", {}),
        "nps": [],
    }

    # Collect all periods
    for r in responses:
        period = r.get("meta", {}).get("statement_period", {})
        if period and period not in merged["meta"]["periods_covered"]:
            merged["meta"]["periods_covered"].append(period)

    # Merge demat accounts by bo_id — keep the entry with highest value
    demat_map = {}
    for r in responses:
        for acct in r.get("demat_accounts", []):
            bo_id = acct.get("bo_id", "")
            if not bo_id:
                continue
            existing = demat_map.get(bo_id)
            if not existing or acct.get("value", 0) >= existing.get("value", 0):
                demat_map[bo_id] = acct
    merged["demat_accounts"] = list(demat_map.values())

    # Merge mutual fund folios by folio_number — keep the one with more schemes/higher value
    folio_map = {}
    for r in responses:
        for folio in r.get("mutual_funds", []):
            fno = folio.get("folio_number", "")
            if not fno:
                continue
            existing = folio_map.get(fno)
            if not existing or folio.get("value", 0) >= existing.get("value", 0):
                folio_map[fno] = folio
    merged["mutual_funds"] = list(folio_map.values())

    # Merge NPS
    nps_seen = set()
    for r in responses:
        for entry in r.get("nps", []):
            key = json.dumps(entry, sort_keys=True)
            if key not in nps_seen:
                nps_seen.add(key)
                merged["nps"].append(entry)

    # Recalculate summary
    demat_val = sum(a.get("value", 0) for a in merged["demat_accounts"])
    mf_val = sum(f.get("value", 0) for f in merged["mutual_funds"])
    ins_count = len(merged.get("insurance", {}).get("life_insurance_policies", []))
    nps_val = 0  # NPS value not always present

    merged["summary"] = {
        "total_value": demat_val + mf_val,
        "accounts": {
            "demat": {"count": len(merged["demat_accounts"]), "total_value": demat_val},
            "mutual_funds": {"count": len(merged["mutual_funds"]), "total_value": mf_val},
            "insurance": {"count": ins_count, "total_value": 0},
            "nps": {"count": len(merged["nps"]), "total_value": nps_val},
        },
    }

    return merged


# ---------------------------------------------------------------------------
# Sidebar: Generate New Report (CDSL OTP flow)
# ---------------------------------------------------------------------------

def render_report_generator():
    """Sidebar form to fetch new CDSL data via OTP."""
    st.sidebar.markdown("### Generate New Report")

    # Initialize session state
    for key in ("otp_session_id", "otp_step", "fetch_pan", "fetch_status"):
        if key not in st.session_state:
            st.session_state[key] = None
    if "otp_step" not in st.session_state or st.session_state.otp_step is None:
        st.session_state.otp_step = "input"

    if st.session_state.otp_step == "input":
        with st.sidebar.form("cdsl_form"):
            pan = st.text_input("PAN Number", max_chars=10, placeholder="ABCDE1234F")
            bo_id = st.text_input("CDSL BO ID (16 digits)", max_chars=16, placeholder="1234567890123456")
            dob = st.date_input("Date of Birth", min_value=datetime(1940, 1, 1), max_value=datetime(2010, 1, 1))
            submitted = st.form_submit_button("Request OTP", use_container_width=True)

        if submitted:
            if not pan or not bo_id:
                st.sidebar.error("PAN and BO ID are required.")
                return

            with st.sidebar.status("Requesting OTP (captcha ~15-20s)...", expanded=True):
                try:
                    resp = httpx.post(
                        f"{BASE_URL}/v4/cdsl/fetch",
                        headers={**api_headers(), "Content-Type": "application/json"},
                        json={"pan": pan.upper(), "bo_id": bo_id, "dob": dob.strftime("%Y-%m-%d")},
                        timeout=60,
                    )
                    data = resp.json()
                except Exception as e:
                    st.sidebar.error(f"Request failed: {e}")
                    return

            if data.get("status") == "failed":
                st.sidebar.error(f"API error: {data.get('msg', 'Unknown error')}")
                return

            session_id = data.get("session_id") or data.get("request_id")
            if session_id:
                st.session_state.otp_session_id = session_id
                st.session_state.fetch_pan = pan.upper()
                st.session_state.otp_step = "verify"
                st.sidebar.success(f"OTP sent! Session: {session_id[:12]}...")
                st.rerun()
            else:
                st.sidebar.warning("No session ID returned.")
                st.sidebar.json(data)

    elif st.session_state.otp_step == "verify":
        st.sidebar.info(f"OTP sent for PAN: {st.session_state.fetch_pan}")
        with st.sidebar.form("otp_form"):
            otp = st.text_input("Enter OTP", max_chars=6, placeholder="123456")
            num_periods = st.slider("Months to fetch", 1, 6, 6)
            verify_btn = st.form_submit_button("Verify & Fetch", use_container_width=True)

        cancel = st.sidebar.button("Cancel", use_container_width=True)
        if cancel:
            st.session_state.otp_step = "input"
            st.session_state.otp_session_id = None
            st.rerun()

        if verify_btn:
            if not otp:
                st.sidebar.error("Enter the OTP.")
                return

            session_id = st.session_state.otp_session_id
            pan = st.session_state.fetch_pan

            with st.sidebar.status("Verifying OTP & fetching files...", expanded=True):
                try:
                    resp = httpx.post(
                        f"{BASE_URL}/v4/cdsl/fetch/{session_id}/verify",
                        headers={**api_headers(), "Content-Type": "application/json"},
                        json={"otp": otp, "num_periods": num_periods},
                        timeout=120,
                    )
                    data = resp.json()
                except Exception as e:
                    st.sidebar.error(f"Verify failed: {e}")
                    return

            if data.get("status") == "failed":
                st.sidebar.error(f"API error: {data.get('msg', 'Unknown')}")
                return

            save_json(data, "cdsl_verify")
            files = data.get("files", [])

            if not files:
                st.sidebar.warning("No PDF files returned.")
                st.session_state.otp_step = "input"
                st.rerun()
                return

            # Download and parse each PDF
            st.sidebar.info(f"Parsing {len(files)} PDF(s)...")
            all_parsed = []
            progress = st.sidebar.progress(0)
            for i, f in enumerate(files):
                url = f.get("url", "")
                name = f.get("filename", f"file_{i+1}")
                if not url:
                    continue

                try:
                    pdf_resp = httpx.get(url, timeout=60)
                    if pdf_resp.status_code != 200:
                        continue

                    parse_resp = httpx.post(
                        f"{BASE_URL}/v4/cdsl/parse",
                        headers=api_headers(),
                        files={"file": (name, pdf_resp.content, "application/pdf")},
                        data={"password": pan},
                        timeout=120,
                    )
                    parsed = parse_resp.json()
                    if "investor" in parsed:
                        all_parsed.append(parsed)
                        save_json(parsed, f"cdsl_parsed_{i+1}")
                except Exception:
                    continue
                progress.progress((i + 1) / len(files))

            if all_parsed:
                save_json(all_parsed, "cdsl_all_parsed")
                st.sidebar.success(f"Parsed {len(all_parsed)} file(s)! Refreshing...")
            else:
                st.sidebar.warning("No files could be parsed.")

            st.session_state.otp_step = "input"
            st.session_state.otp_session_id = None
            st.rerun()


# ---------------------------------------------------------------------------
# Sidebar: Upload CAS PDF
# ---------------------------------------------------------------------------

def render_pdf_upload():
    st.sidebar.markdown("### Or Upload CAS PDF")
    uploaded = st.sidebar.file_uploader("Upload CAS PDF", type=["pdf"], label_visibility="collapsed")
    if uploaded:
        password = st.sidebar.text_input("PDF password (PAN)", placeholder="ABCDE1234F")
        if st.sidebar.button("Parse PDF", use_container_width=True):
            if not password:
                st.sidebar.error("Password required.")
                return
            with st.sidebar.status("Parsing PDF..."):
                try:
                    resp = httpx.post(
                        f"{BASE_URL}/v4/smart/parse",
                        headers=api_headers(),
                        files={"file": (uploaded.name, uploaded.getvalue(), "application/pdf")},
                        data={"password": password},
                        timeout=120,
                    )
                    data = resp.json()
                except Exception as e:
                    st.sidebar.error(f"Parse failed: {e}")
                    return

            if data.get("status") == "failed":
                st.sidebar.error(f"API error: {data.get('msg', 'Unknown')}")
            elif "investor" in data:
                save_json(data, "smart_parse")
                st.sidebar.success("Parsed! Refreshing...")
                st.rerun()
            else:
                st.sidebar.warning("Unexpected response.")
                st.sidebar.json(data)


# ---------------------------------------------------------------------------
# Dashboard sections (same rendering as before, now on aggregated data)
# ---------------------------------------------------------------------------

def render_header(data):
    investor = data.get("investor", {})
    meta = data.get("meta", {})
    summary = data.get("summary", {})

    st.markdown("# 📊 Navnit — Portfolio Dashboard")

    periods = meta.get("periods_covered", [])
    merged_count = meta.get("statements_merged", 1)
    if periods:
        date_range = f"{periods[-1].get('from', '?')} to {periods[0].get('to', '?')}"
    else:
        period = meta.get("statement_period", {})
        date_range = f"{period.get('from', '?')} to {period.get('to', '?')}"

    st.caption(
        f"Data from **{merged_count} statement(s)** · "
        f"Period: **{date_range}** · "
        f"Last updated: {meta.get('generated_at', 'N/A')}"
    )
    st.divider()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Investor", investor.get("name", "N/A").title())
    col2.metric("PAN", investor.get("pan", "N/A"))
    col3.metric("CAS ID", investor.get("cas_id", "N/A"))
    col4.metric("Total Portfolio Value", fmt_inr(summary.get("total_value", 0)))


def render_summary_cards(data):
    summary = data.get("summary", {})
    accounts = summary.get("accounts", {})

    st.markdown("## Portfolio Overview")

    cols = st.columns(4)
    sections = [
        ("Mutual Funds", accounts.get("mutual_funds", {})),
        ("Demat Holdings", accounts.get("demat", {})),
        ("Insurance", accounts.get("insurance", {})),
        ("NPS", accounts.get("nps", {})),
    ]
    for col, (label, info) in zip(cols, sections):
        count = info.get("count", 0)
        value = info.get("total_value", 0)
        col.metric(label, fmt_inr(value), f"{count} account(s)")


def render_allocation_chart(data):
    summary = data.get("summary", {})
    accounts = summary.get("accounts", {})

    values, labels = [], []
    for label, key in [("Mutual Funds", "mutual_funds"), ("Demat", "demat"),
                        ("Insurance", "insurance"), ("NPS", "nps")]:
        v = accounts.get(key, {}).get("total_value", 0)
        if v > 0:
            values.append(v)
            labels.append(label)

    if not values:
        return

    col1, col2 = st.columns(2)

    with col1:
        fig = px.pie(
            names=labels, values=values,
            title="Asset Allocation",
            color_discrete_sequence=px.colors.qualitative.Set2,
            hole=0.4,
        )
        fig.update_traces(textinfo="label+percent+value", texttemplate="%{label}<br>₹%{value:,.2f}<br>%{percent}")
        fig.update_layout(showlegend=False, margin=dict(t=40, b=0, l=0, r=0))
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        broker_data = []
        for acct in data.get("demat_accounts", []):
            dp = acct.get("dp_name", "Unknown")
            val = acct.get("value", 0)
            broker_data.append({"Platform": dp.replace(" PRIVATE LIMITED", "").title(), "Value": val})
        for folio in data.get("mutual_funds", []):
            amc = folio.get("amc", "Unknown")
            val = folio.get("value", 0)
            if val > 0:
                broker_data.append({"Platform": amc, "Value": val})

        df = pd.DataFrame(broker_data)
        if not df.empty and df["Value"].sum() > 0:
            df = df[df["Value"] > 0]
            fig = px.pie(
                df, names="Platform", values="Value",
                title="Platform / AMC Allocation",
                color_discrete_sequence=px.colors.qualitative.Pastel,
                hole=0.4,
            )
            fig.update_traces(textinfo="label+percent+value", texttemplate="%{label}<br>₹%{value:,.2f}<br>%{percent}")
            fig.update_layout(showlegend=False, margin=dict(t=40, b=0, l=0, r=0))
            st.plotly_chart(fig, use_container_width=True)


def render_mutual_funds(data):
    mf = data.get("mutual_funds", [])
    if not mf:
        return

    st.markdown("## Mutual Funds")

    rows = []
    for folio in mf:
        amc = folio.get("amc", "")
        folio_no = folio.get("folio_number", "")
        for scheme in folio.get("schemes", []):
            gain = scheme.get("gain", {})
            name = scheme.get("name", "")
            short_name = name.split(" - ")[-1] if " - " in name else name
            rows.append({
                "AMC": amc,
                "Folio": folio_no,
                "Scheme": short_name,
                "Type": scheme.get("type", ""),
                "Units": scheme.get("units", 0),
                "NAV": scheme.get("nav", 0),
                "Cost": scheme.get("cost", 0),
                "Value": scheme.get("value", 0),
                "Gain (₹)": gain.get("absolute", 0),
                "Gain (%)": gain.get("percentage", 0),
                "ISIN": scheme.get("isin", ""),
            })

    if not rows:
        return

    df = pd.DataFrame(rows)

    total_cost = df["Cost"].sum()
    total_value = df["Value"].sum()
    total_gain = df["Gain (₹)"].sum()
    total_gain_pct = (total_gain / total_cost * 100) if total_cost else 0

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Invested", fmt_inr(total_cost))
    c2.metric("Current Value", fmt_inr(total_value))
    c3.metric("Total P&L", fmt_inr(total_gain), f"{total_gain_pct:+.1f}%")
    c4.metric("Schemes", len(rows))

    # Gain/loss bar chart
    df_sorted = df.sort_values("Gain (₹)")
    colors = ["#e74c3c" if g < 0 else "#2ecc71" for g in df_sorted["Gain (₹)"]]
    fig = go.Figure(go.Bar(
        x=df_sorted["Gain (₹)"],
        y=df_sorted["Scheme"],
        orientation="h",
        marker_color=colors,
        text=[fmt_inr(v) for v in df_sorted["Gain (₹)"]],
        textposition="outside",
    ))
    fig.update_layout(
        title="Scheme-wise Profit / Loss",
        xaxis_title="Gain (₹)", yaxis_title="",
        height=max(250, len(rows) * 60),
        margin=dict(l=0, r=80),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Table
    st.dataframe(
        df.style.format({
            "Units": "{:.3f}", "NAV": "₹{:.4f}",
            "Cost": "₹{:,.2f}", "Value": "₹{:,.2f}",
            "Gain (₹)": "₹{:,.2f}", "Gain (%)": "{:+.2f}%",
        }).map(
            lambda v: "color: #e74c3c" if isinstance(v, (int, float)) and v < 0
            else "color: #2ecc71" if isinstance(v, (int, float)) and v > 0 else "",
            subset=["Gain (₹)", "Gain (%)"],
        ),
        use_container_width=True, hide_index=True,
    )

    # Transactions
    with st.expander("View Transactions"):
        for folio in mf:
            for scheme in folio.get("schemes", []):
                txns = scheme.get("transactions", [])
                if not txns:
                    continue
                name = scheme.get("name", "")
                short_name = name.split(" - ")[-1] if " - " in name else name
                st.markdown(f"**{short_name}**")
                txn_rows = [{
                    "Date": t.get("date", ""),
                    "Description": t.get("description", ""),
                    "Type": t.get("type", ""),
                    "Amount": t.get("amount", 0),
                    "Units": t.get("units", 0),
                    "NAV": t.get("nav", 0),
                    "Balance": t.get("balance", 0),
                } for t in txns]
                if txn_rows:
                    st.dataframe(pd.DataFrame(txn_rows), use_container_width=True, hide_index=True)


def render_demat_accounts(data):
    demat = data.get("demat_accounts", [])
    if not demat:
        return

    st.markdown("## Demat Accounts")

    for acct in demat:
        dp = acct.get("dp_name", "Unknown")
        bo_id = acct.get("bo_id", "")
        value = acct.get("value", 0)
        info = acct.get("additional_info", {})
        status = info.get("status", "N/A")
        nominee = info.get("nominee", "N/A")
        holdings = acct.get("holdings", {})

        total_securities = sum(len(holdings.get(k, [])) for k in holdings)
        has_holdings = total_securities > 0 or value > 0

        status_icon = "🟢" if status == "Active" else "🔴"
        nominee_warn = " ⚠️" if isinstance(nominee, str) and "not" in nominee.lower() else ""

        with st.expander(f"{status_icon} **{dp}** — {fmt_inr(value)} · BO: {bo_id}", expanded=has_holdings):
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Status", status)
            c2.metric("Client ID", acct.get("client_id", "N/A"))
            c3.metric("Nominee", f"{nominee}{nominee_warn}")
            c4.metric("Securities", total_securities)

            for category, items in holdings.items():
                if not items:
                    continue
                st.markdown(f"**{category.replace('_', ' ').title()}**")
                rows = [{
                    "Name": sec.get("name", "").split("#")[-1] if "#" in sec.get("name", "") else sec.get("name", ""),
                    "ISIN": sec.get("isin", ""),
                    "Units": sec.get("units", 0),
                    "Value": sec.get("value", 0),
                } for sec in items]
                st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)


def render_analysis(data):
    st.markdown("## Portfolio Analysis")

    summary = data.get("summary", {})
    accounts = summary.get("accounts", {})
    demat = data.get("demat_accounts", [])
    mf = data.get("mutual_funds", [])

    findings = []
    warnings = []

    # Nominee check
    no_nominee = [
        acct.get("dp_name", "Unknown")
        for acct in demat
        if isinstance(acct.get("additional_info", {}).get("nominee", ""), str)
        and "not" in acct["additional_info"]["nominee"].lower()
    ]
    if no_nominee:
        warnings.append(f"**No nominee registered** on {len(no_nominee)} demat account(s): {', '.join(no_nominee)}.")

    # Empty accounts
    empty = [a.get("dp_name", "?") for a in demat if a.get("value", 0) == 0]
    if empty:
        findings.append(f"**{len(empty)} empty demat account(s):** {', '.join(empty)}. Consider closing unused ones.")

    # Concentration risk
    all_schemes = []
    for folio in mf:
        for scheme in folio.get("schemes", []):
            all_schemes.append({
                "name": scheme.get("name", ""),
                "value": scheme.get("value", 0),
                "type": scheme.get("type", ""),
            })

    total = summary.get("total_value", 0)
    if total > 0 and all_schemes:
        top = max(all_schemes, key=lambda s: s["value"])
        pct = top["value"] / total * 100
        if pct > 50:
            warnings.append(f"**High concentration:** {pct:.0f}% of portfolio in one scheme.")

    # Category breakdown
    types = {}
    for s in all_schemes:
        t = s["type"] or "OTHER"
        types[t] = types.get(t, 0) + s["value"]
    if types:
        findings.append("**MF Category split:** " + ", ".join(f"{k}: {fmt_inr(v)}" for k, v in types.items()))

    # P&L
    total_cost = sum(s.get("cost", 0) for folio in mf for s in folio.get("schemes", []))
    total_val = accounts.get("mutual_funds", {}).get("total_value", 0)
    if total_cost > 0:
        overall_gain = total_val - total_cost
        overall_pct = overall_gain / total_cost * 100
        color = "🔴" if overall_gain < 0 else "🟢"
        findings.append(f"**Overall MF P&L:** {color} {fmt_inr(overall_gain)} ({overall_pct:+.1f}%) on {fmt_inr(total_cost)} invested")

    losers = [s for s in all_schemes if any(
        sch.get("gain", {}).get("absolute", 0) < 0
        for folio in mf for sch in folio.get("schemes", []) if sch.get("name") == s["name"]
    )]
    if losers:
        warnings.append(f"**{len(losers)} scheme(s) in the red.** Review SIP averaging or consider exit.")

    if warnings:
        st.markdown("### ⚠️ Action Items")
        for w in warnings:
            st.warning(w)

    if findings:
        st.markdown("### Observations")
        for f in findings:
            st.info(f)


def render_raw_json(data):
    with st.expander("View Raw JSON (aggregated)"):
        st.json(data)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # --- Sidebar ---
    with st.sidebar:
        render_report_generator()
        st.divider()
        render_pdf_upload()
        st.divider()
        st.markdown("### About")
        st.caption("Built on [CASParser.in](https://casparser.in) API data.")

    # --- Load & aggregate all data ---
    responses = load_all_parsed_responses()

    if not responses:
        st.markdown("# 📊 Navnit — Portfolio Dashboard")
        st.info("No portfolio data found. Use the sidebar to generate a report or upload a CAS PDF.")
        st.stop()

    portfolios = aggregate_by_pan(responses)

    # If multiple PANs, let user pick
    if len(portfolios) > 1:
        with st.sidebar:
            st.markdown("### Select Investor")
            pan_options = {
                f"{v.get('investor', {}).get('name', 'Unknown').title()} ({pan})": pan
                for pan, v in portfolios.items()
            }
            selected_label = st.selectbox("Investor", list(pan_options.keys()))
            selected_pan = pan_options[selected_label]
            data = portfolios[selected_pan]
    else:
        data = list(portfolios.values())[0]

    # --- Render dashboard ---
    render_header(data)
    render_summary_cards(data)
    render_allocation_chart(data)
    render_mutual_funds(data)
    render_demat_accounts(data)
    render_analysis(data)
    render_raw_json(data)


if __name__ == "__main__":
    main()
