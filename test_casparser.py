"""CASParser.in API Testing Tool — quick CLI to explore API responses."""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.json import JSON
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

load_dotenv()

console = Console()
BASE_URL = "https://api.casparser.in"
API_KEY = os.getenv("CASPARSER_API_KEY", "")


def get_headers():
    return {"x-api-key": API_KEY}


def save_response(data, prefix):
    """Save raw response JSON to a file."""
    filename = f"response_{prefix}_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.json"
    Path(filename).write_text(json.dumps(data, indent=2, ensure_ascii=False))
    console.print(f"\n[dim]Saved to {filename}[/dim]")
    return filename


def print_response(response: httpx.Response):
    """Print status, headers, and body of an API response."""
    # Status
    color = "green" if response.status_code < 400 else "red"
    console.print(f"\n[bold {color}]HTTP {response.status_code}[/bold {color}]")

    # Headers table
    table = Table(title="Response Headers", show_lines=False, pad_edge=False)
    table.add_column("Header", style="cyan")
    table.add_column("Value", style="white")
    for key in ("x-request-id", "x-credits-used", "x-credits-remaining", "content-type"):
        if key in response.headers:
            table.add_row(key, response.headers[key])
    console.print(table)

    # Body
    try:
        data = response.json()
        console.print(Panel(JSON(json.dumps(data, ensure_ascii=False)), title="Response Body"))
        return data
    except Exception:
        console.print(Panel(response.text[:2000], title="Response Body (raw)"))
        return None


def print_summary(data):
    """Print a quick summary if the response contains portfolio data."""
    if not isinstance(data, dict) or data.get("status") == "failed":
        return

    investor = data.get("investor", {})
    summary = data.get("summary", {})
    demat = data.get("demat_accounts", [])
    mf = data.get("mutual_funds", [])

    name = investor.get("name", "N/A")
    email = investor.get("email", "N/A")

    folio_count = len(mf)
    scheme_count = sum(len(f.get("schemes", [])) for f in mf) if mf else 0
    stock_count = sum(len(a.get("securities", [])) for a in demat) if demat else 0
    total_value = summary.get("total_value", "N/A")

    console.print(Panel(
        f"[bold]Investor:[/bold] {name} ({email})\n"
        f"[bold]Folios:[/bold] {folio_count}\n"
        f"[bold]MF Schemes:[/bold] {scheme_count}\n"
        f"[bold]Demat Securities:[/bold] {stock_count}\n"
        f"[bold]Total Value:[/bold] {total_value}",
        title="Quick Summary",
        border_style="green",
    ))


# ---------------------------------------------------------------------------
# Menu options
# ---------------------------------------------------------------------------

def test_smart_parse():
    """Upload a CAS PDF and parse it."""
    file_path = Prompt.ask("[cyan]Path to CAS PDF file[/cyan]")
    file_path = file_path.strip().strip("'\"")

    if not Path(file_path).is_file():
        console.print(f"[red]File not found: {file_path}[/red]")
        return

    password = Prompt.ask("[cyan]PDF password (usually your PAN)[/cyan]", default="test")

    console.print("\n[bold]Uploading and parsing...[/bold]")
    with open(file_path, "rb") as f:
        response = httpx.post(
            f"{BASE_URL}/v4/smart/parse",
            headers=get_headers(),
            files={"file": (Path(file_path).name, f, "application/pdf")},
            data={"password": password},
            timeout=120,
        )

    data = print_response(response)
    if data:
        print_summary(data)
        save_response(data, "smart_parse")


def test_cdsl_fetch():
    """CDSL OTP flow: request OTP -> enter OTP -> get PDF download URLs."""
    pan = Prompt.ask("[cyan]Enter PAN number[/cyan]", default="ABCDE1234F")
    bo_id = Prompt.ask("[cyan]Enter CDSL BO ID (16 digits)[/cyan]")
    dob = Prompt.ask("[cyan]Enter date of birth (YYYY-MM-DD)[/cyan]")

    console.print("\n[bold]Step 1: Requesting OTP (may take 15-20s for captcha)...[/bold]")
    response = httpx.post(
        f"{BASE_URL}/v4/cdsl/fetch",
        headers={**get_headers(), "Content-Type": "application/json"},
        json={"pan": pan, "bo_id": bo_id, "dob": dob},
        timeout=60,
    )

    data = print_response(response)
    if not data:
        return
    save_response(data, "cdsl_request")

    if data.get("status") == "failed":
        console.print(f"[red]API error: {data.get('msg', 'unknown')}[/red]")
        return

    session_id = data.get("session_id") or data.get("request_id")
    if not session_id:
        console.print("[yellow]No session_id in response. Raw data saved above.[/yellow]")
        return

    console.print(f"\n[green]Session ID: {session_id}[/green]")
    otp = Prompt.ask("[cyan]Enter the OTP you received[/cyan]")
    num_periods = Prompt.ask("[cyan]Number of monthly statements to fetch[/cyan]", default="6")

    console.print("\n[bold]Step 2: Verifying OTP and fetching files...[/bold]")
    response = httpx.post(
        f"{BASE_URL}/v4/cdsl/fetch/{session_id}/verify",
        headers={**get_headers(), "Content-Type": "application/json"},
        json={"otp": otp, "num_periods": int(num_periods)},
        timeout=120,
    )

    data = print_response(response)
    if not data:
        return
    save_response(data, "cdsl_verify")

    files = data.get("files", [])
    if not files:
        print_summary(data)
        return

    console.print(f"\n[green]Got {len(files)} PDF file(s). Now parsing them for structured data...[/green]")

    all_parsed = []
    for i, f in enumerate(files, 1):
        url = f.get("url", "")
        name = f.get("filename", f"file_{i}")
        if not url:
            continue

        console.print(f"\n[bold]Downloading & parsing [{i}/{len(files)}]: {name}[/bold]")

        # Download the PDF
        pdf_resp = httpx.get(url, timeout=60)
        if pdf_resp.status_code != 200:
            console.print(f"[red]Failed to download {name} (HTTP {pdf_resp.status_code})[/red]")
            continue

        # Parse it via the CDSL parse endpoint
        parse_resp = httpx.post(
            f"{BASE_URL}/v4/cdsl/parse",
            headers=get_headers(),
            files={"file": (name, pdf_resp.content, "application/pdf")},
            data={"password": pan},
            timeout=120,
        )

        parsed = print_response(parse_resp)
        if parsed:
            print_summary(parsed)
            all_parsed.append(parsed)
            save_response(parsed, f"cdsl_parsed_{i}")

    if all_parsed:
        save_response(all_parsed, "cdsl_all_parsed")
        console.print(f"\n[bold green]Parsed {len(all_parsed)} file(s) into structured JSON.[/bold green]")


def test_kfintech_generate():
    """Trigger CAS email via KFintech mailback."""
    pan = Prompt.ask("[cyan]Enter PAN number[/cyan]", default="ABCDE1234F")
    email = Prompt.ask("[cyan]Enter email address[/cyan]")

    console.print("\n[bold]Requesting CAS generation...[/bold]")
    response = httpx.post(
        f"{BASE_URL}/v4/kfintech/generate",
        headers={**get_headers(), "Content-Type": "application/json"},
        json={"pan": pan, "email": email},
        timeout=30,
    )

    data = print_response(response)
    if data:
        save_response(data, "kfintech")


def test_connectivity():
    """Check API connectivity by hitting the credits endpoint."""
    console.print("\n[bold]Checking API connectivity...[/bold]")
    response = httpx.post(
        f"{BASE_URL}/v1/credits",
        headers=get_headers(),
        timeout=10,
    )

    data = print_response(response)
    if data:
        save_response(data, "credits")


# ---------------------------------------------------------------------------
# Main menu
# ---------------------------------------------------------------------------

def main():
    if not API_KEY:
        console.print("[red]CASPARSER_API_KEY not set. Create a .env file with your key.[/red]")
        sys.exit(1)

    console.print(Panel(
        f"[bold]API Key:[/bold] {API_KEY[:8]}...{API_KEY[-4:]}\n"
        f"[bold]Base URL:[/bold] {BASE_URL}",
        title="CASParser API Tester",
        border_style="blue",
    ))

    actions = {
        "1": ("Test Smart Parse (upload a CAS PDF)", test_smart_parse),
        "2": ("Test CDSL OTP Fetch (PAN → OTP → data)", test_cdsl_fetch),
        "3": ("Test CAS Generator (trigger email mailback)", test_kfintech_generate),
        "4": ("Test API connectivity (credits check)", test_connectivity),
        "5": ("Exit", None),
    }

    while True:
        console.print()
        for key, (label, _) in actions.items():
            console.print(f"  [bold cyan]{key}.[/bold cyan] {label}")

        choice = Prompt.ask("\n[bold]Choose an option[/bold]", choices=list(actions.keys()))

        if choice == "5":
            console.print("[dim]Bye![/dim]")
            break

        _, fn = actions[choice]
        try:
            fn()
        except httpx.ConnectError:
            console.print("[red]Connection failed. Check your internet or the API URL.[/red]")
        except httpx.TimeoutException:
            console.print("[red]Request timed out.[/red]")
        except KeyboardInterrupt:
            console.print("\n[dim]Cancelled.[/dim]")


if __name__ == "__main__":
    main()
