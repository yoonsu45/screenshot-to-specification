"""Publish a minimal official-only search snapshot from the original API CSV."""
import csv
import hashlib
import json

from clean_kspo_performances import ROOT, clean_rows


def main():
    source = ROOT / "data/kspo_performances.csv"
    with source.open(encoding="utf-8-sig", newline="") as stream:
        records = clean_rows(list(csv.DictReader(stream)))
    snapshot = {
        "sourceType": "official_public_data",
        "sourceName": "한국체육산업개발 공연정보 Open API",
        "inputSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "events": [
            {key: record[key] for key in ["id", "title", "venue", "startDate", "sourceRows"]}
            for record in records if record["title"]
        ],
    }
    target = ROOT / "src/data/official-events.json"
    target.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("Exported {} official records".format(len(snapshot["events"])))


if __name__ == "__main__":
    main()
