"""Match an official poster CSV to API records; ambiguous matches stay unlinked."""
import argparse
import csv
import hashlib
import io
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

from clean_kspo_performances import ROOT, normalize_venue


def normalize(value):
    return re.sub(r"[^\w가-힣]", "", value.casefold())


def match_posters(events, posters):
    api_index = defaultdict(list)
    poster_index = defaultdict(list)
    for event in events:
        api_index[(normalize(event["title"]), normalize(normalize_venue(event["venue"] or "") or ""))].append(event)
    for line, row in enumerate(posters, 2):
        key = (normalize(row["제목"]), normalize(normalize_venue(row["공연장소"]) or ""))
        poster_index[key].append((line, row))
    matches, review = [], []
    for key, candidates in poster_index.items():
        api = api_index.get(key, [])
        if not key[1] or len(candidates) != 1 or len(api) != 1:
            review.extend({"posterRow": line, "title": row["제목"], "reason": "missing_or_ambiguous_title_venue"} for line, row in candidates)
            continue
        line, row = candidates[0]
        url = row["연결홈페이지주소"].strip()
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.hostname not in {"www.ksponco.or.kr", "ksponco.or.kr"}:
            review.append({"posterRow": line, "title": row["제목"], "reason": "unsupported_image_url"})
            continue
        matches.append({"eventId": api[0]["id"], "imageUrl": url, "posterId": row["공연포스터 일련번호"], "posterRow": line,
                        "scheduleRaw": row["공연일"].strip(), "posterTitle": row["제목"], "venueRaw": row["공연장소"],
                        "dataAsOf": row["데이터 기준일"], "matchMethod": "unique_normalized_title_and_venue"})
    return matches, review


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("poster_csv", type=Path)
    args = parser.parse_args()
    data = args.poster_csv.read_bytes()
    try:
        content = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        content = data.decode("cp949")
    posters = list(csv.DictReader(io.StringIO(content)))
    events = json.loads((ROOT / "src/data/official-events.json").read_text(encoding="utf-8"))["events"]
    matches, review = match_posters(events, posters)
    payload = {"sourceName": "한국체육산업개발주식회사 공연 포스터 정보", "sourceSha256": hashlib.sha256(data).hexdigest(), "matches": matches}
    (ROOT / "src/data/official-posters.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {"posterRows": len(posters), "matched": len(matches), "review": review}
    output = ROOT / "data/processed/poster-match-report.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"posterRows": len(posters), "matched": len(matches), "reviewRows": len(review)}))


if __name__ == "__main__":
    main()
