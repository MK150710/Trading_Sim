import re
import yfinance as yf

def get_about(symbol):
    ticker = yf.Ticker(symbol)
    info = ticker.info

    officers = info.get("companyOfficers", [])

    ceo = next(
        (
            officer.get("name")
            for officer in officers
            if "ceo" in officer.get("title", "").lower()
            or "chief executive" in officer.get("title", "").lower()
        ),
        "N/A",
    )

    summary = info.get("longBusinessSummary", "")

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

    match = re.search(r'(?<=\.)\s', temp)

    if match:
        one_line_summary = summary[:match.start() + 1]
    else:
        one_line_summary = summary

    parts = [
        info.get("city"),
        info.get("state"),
        info.get("country"),
    ]
    headquarters = ", ".join(filter(None, parts)) or "N/A"
    employees = info.get("fullTimeEmployees")
    employees = f"{employees:,}" if employees else "N/A"

    website = info.get("website") or "N/A"

    return {
        "name": info.get("longName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "ceo": ceo,
        "hq": headquarters,
        "employees": employees,
        "website": website,
        "description": one_line_summary,
    }
