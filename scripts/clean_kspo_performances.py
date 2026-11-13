"""Offline official CSV cleanup. Never infer event dates from registration dates."""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MISSING = {"", ".", "-", "미정", "없음"}
DATE_PATTERN = r"((?:19|20)\d{2})\s*[년./-]\s*(\d{1,2})\s*[월./-]\s*(\d{1,2})\s*일?"
VENUES = {
    "체조경기장": "KSPO DOME", "올림픽체조경기장": "KSPO DOME",
    "KSPO DOME(체조경기장)": "KSPO DOME",
    "KSPO DOME(올림픽체조경기장)": "KSPO DOME",
    "K아트홀": "K-아트홀",
}


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.hidden += 1
        if tag in {"p", "br", "div", "tr", "td", "li"}:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in {"script", "style"}:
            self.hidden = max(0, self.hidden - 1)
        self.parts.append(" ")

    def handle_data(self, value):
        if not self.hidden:
            self.parts.append(value)


def text(value):
    parser = PlainText()
    parser.feed(value.replace("\\n", " "))
    return re.sub(r"\s+", " ", "".join(parser.parts)).strip()


def value_or_none(value):
    value = text(value)
    return None if value in MISSING else value


def normalize_venue(value):
    venue = value_or_none(value)
    if venue is None or venue == "기타":
        return None
    venue = re.sub(r"^올림픽공원\s+", "", venue)
    return VENUES.get(venue, venue)


def dates_from(value):
    result = []
    for match in re.finditer(DATE_PATTERN, value):
        try:
            parsed = date(*map(int, match.groups())).isoformat()
        except ValueError:
            continue
        if parsed not in result:
            result.append(parsed)
    return result


def clean_rows(rows):
    records = []
    seen = {}
    for line, row in enumerate(rows, start=2):
        # Compare original values: similar titles may represent different performances.
        canonical = json.dumps(row, ensure_ascii=False, sort_keys=True)
        if canonical in seen:
            seen[canonical]["sourceRows"].append(line)
            continue
        temporal = value_or_none(row.get("temporalCoverage", ""))
        candidates = dates_from(temporal or "")
        exact_date = bool(temporal and re.fullmatch(DATE_PATTERN, temporal))
        start_date = candidates[0] if exact_date and len(candidates) == 1 else None
        venue = normalize_venue(row.get("spatial", ""))
        title = value_or_none(row.get("title", ""))
        issues = []
        if not title:
            issues.append("missing_title")
        if not venue:
            issues.append("missing_or_unspecified_venue")
        if not start_date:
            issues.append("event_date_requires_review" if temporal else "missing_event_date")
        record = {
            "id": "kspo-" + hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
            "sourceType": "official_public_data",
            "isDemo": False,
            "sourceName": "한국체육산업개발 공연정보 Open API",
            "sourceFile": "data/kspo_performances.csv",
            "sourceRows": [line],
            "collectedAt": None,  # File modification time is not a collection timestamp.
            "officialUrl": None,  # No event detail URL is supplied in this CSV.
            "title": title,
            "venue": venue,
            "venueRaw": row.get("spatial", ""),
            "startDate": start_date,
            "endDate": None,
            "dateStatus": "explicit_single_date" if start_date else "unknown_or_needs_review",
            "dateCandidates": candidates,
            "scheduleRaw": row.get("temporalCoverage", ""),
            "registeredAtRaw": row.get("regDate", ""),
            "durationRaw": value_or_none(row.get("extent", "")),
            "descriptionText": text(row.get("description", "")),
            "reviewIssues": issues,
            "readyForDateComparison": bool(title and venue and start_date),
        }
        seen[canonical] = record
        records.append(record)
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "data/kspo_performances.csv")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data/processed")
    args = parser.parse_args()
    source = args.input.resolve()
    targets = [args.output_dir / name for name in ("kspo_performances.cleaned.json", "kspo_quality_report.json")]
    if source in [target.resolve() for target in targets]:
        parser.error("Output must not overwrite the input CSV")
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {"title", "spatial", "temporalCoverage", "regDate"}
        if not required.issubset(reader.fieldnames or []):
            parser.error("Missing required columns: " + ", ".join(sorted(required - set(reader.fieldnames or []))))
        rows = list(reader)
    records = clean_rows(rows)
    report = {
        "inputSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "inputRows": len(rows), "uniqueRows": len(records),
        "exactDuplicatesRemoved": len(rows) - len(records),
        "nonemptyByColumn": {key: sum(bool(row[key].strip()) for row in rows) for key in (reader.fieldnames or [])},
        "reviewIssueCounts": dict(Counter(issue for record in records for issue in record["reviewIssues"])),
        "dateComparisonReadyRows": sum(record["readyForDateComparison"] for record in records),
        "rules": ["Registration date is never used as event date.",
                  "Only an entire, explicit single date is accepted automatically.",
                  "Date candidates are not confirmed dates; no missing year is inferred.",
                  "Only byte-equivalent parsed rows are deduplicated; source CSV line numbers are retained.",
                  "Source provenance does not guarantee completeness or current schedules."],
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for target, payload in zip(targets, [records, report]):
        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ["inputRows", "uniqueRows", "exactDuplicatesRemoved", "dateComparisonReadyRows", "reviewIssueCounts"]}, ensure_ascii=True))


if __name__ == "__main__":
    main()
