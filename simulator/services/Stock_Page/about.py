import re
import pandas as pd
import yfinance as yf


def safe(value):
    return None if pd.isna(value) else value


def get_about(symbol):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        officers = info.get("companyOfficers") or []

        ceo = next(
            (
                safe(officer.get("name"))
                for officer in officers
                if isinstance(officer, dict)
                and (
                    "ceo" in officer.get("title", "").lower()
                    or "chief executive" in officer.get("title", "").lower()
                )
            ),
            "N/A",
        )

        summary = safe(info.get("longBusinessSummary")) or ""

        temp = (
            summary
            .replace("Inc.", "Inc•")
            .replace("Corp.", "Corp•")
            .replace("Ltd.", "Ltd•")
            .replace("Co.", "Co•")
            .replace("PLC.", "PLC•")
            .replace("N.V.", "N•V•")
            .replace("S.A.", "S•A•")
        )

        match = re.search(r"(?<=\.)\s", temp)

        if match:
            one_line_summary = summary[: match.start() + 1]
        else:
            one_line_summary = summary

        parts = [
            safe(info.get("city")),
            safe(info.get("state")),
            safe(info.get("country")),
        ]

        headquarters = ", ".join(filter(None, parts)) or "N/A"

        employees = safe(info.get("fullTimeEmployees"))
        employees = f"{employees:,}" if employees else "N/A"

        website = safe(info.get("website")) or "N/A"

        return {
            "name": safe(info.get("longName")) or symbol,
            "sector": safe(info.get("sector")) or "N/A",
            "industry": safe(info.get("industry")) or "N/A",
            "ceo": ceo,
            "hq": headquarters,
            "employees": employees,
            "website": website,
            "description": one_line_summary or "N/A",
        }

    except Exception as e:
        print(f"ABOUT ERROR for {symbol}: {repr(e)}")
        return {
            "name": symbol,
            "sector": "N/A",
            "industry": "N/A",
            "ceo": "N/A",
            "hq": "N/A",
            "employees": "N/A",
            "website": "N/A",
            "description": "N/A",
        }