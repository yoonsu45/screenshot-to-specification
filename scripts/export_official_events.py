"""Publish a minimal official-only search snapshot from the original API CSV."""
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter

from clean_kspo_performances import ROOT, clean_rows


def exclusion_reason(title):
    if not title:
        return "missing_title"
    compact = re.sub(r"\s+", "", unicodedata.normalize("NFKC", title))
    if compact in {"예약완료", "준비대관", "철거대관", "대관예정", "행사철거"}:
        return "booking_or_setup_status"
    if compact in {"무대점검", "내부공사", "시설물작업", "시설보수", "무대바턴와이어교체및점검"}:
        return "facility_maintenance"
    if re.match(r"^(?:옥외)?주간(?:옥외)?(?:행사)?(?:계획|기획)(?:\(|\d|$)", compact):
        return "weekly_schedule_summary"
    if re.fullmatch(r"(?:\d{4}년)?수시대관예약가능일정", compact):
        return "rental_availability_notice"
    return None


def main():
    source = ROOT / "data/kspo_performances.csv"
    with source.open(encoding="utf-8-sig", newline="") as stream:
        records = clean_rows(list(csv.DictReader(stream)))
    published = []
    excluded = []
    for record in records:
        reason = exclusion_reason(record["title"])
        if reason:
            excluded.append({"id": record["id"], "title": record["title"], "sourceRows": record["sourceRows"], "reason": reason})
        else:
            published.append(record)
    snapshot = {
        "sourceType": "official_public_data",
        "sourceName": "한국체육산업개발 공연정보 Open API",
        "inputSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "events": [
            {key: record[key] for key in ["id", "title", "venue", "startDate", "sourceRows"]}
            for record in published
        ],
    }
    target = ROOT / "src/data/official-events.json"
    target.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    report = ROOT / "data/processed/official-event-exclusions.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({"inputRecords": len(records), "publishedEvents": len(published), "excludedRecords": len(excluded), "reasonCounts": dict(Counter(record["reason"] for record in excluded)), "records": excluded}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Exported {} official records".format(len(snapshot["events"])))
    print("Exclusions: " + json.dumps(dict(Counter(record["reason"] for record in excluded))))


if __name__ == "__main__":
    main()
