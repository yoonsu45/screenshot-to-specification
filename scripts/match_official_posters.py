"""Match an official poster CSV to API records; ambiguous matches stay unlinked."""
import argparse
import csv
import hashlib
import io
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote, urlparse

from clean_kspo_performances import ROOT, normalize_venue
from export_official_events import exclusion_reason


def normalize(value):
    return re.sub(r"[^\w가-힣]", "", value.casefold())


def venue_key(value):
    value = normalize(normalize_venue(value or "") or "")
    value = re.sub(r"^올림픽공원(?:내)?", "", value)
    value = re.sub(r"^내(?=sk|올림픽홀)", "", value)
    if value in {"kspodome", "kspodome체조경기장", "kspodome올림픽체조경기장", "체조경기장"}:
        return "kspodome"
    if value in {"sk올림픽핸드볼경기장", "sk핸드볼경기장", "핸드볼경기장"}:
        return "핸드볼경기장"
    if value in {"우리금융아트홀올림픽역도경기장", "우리금융아트홀"}:
        return "우리금융아트홀"
    return value


def match_posters(events, posters):
    api_index = defaultdict(list)
    poster_index = defaultdict(list)
    for event in events:
        api_index[(normalize(event["title"]), venue_key(event["venue"]))].append(event)
    for line, row in enumerate(posters, 2):
        key = (normalize(row["제목"]), venue_key(row["공연장소"]))
        poster_index[key].append((line, row))
    matches, review = [], []
    for key, candidates in poster_index.items():
        api = api_index.get(key, [])
        if not key[1] or len(candidates) != 1 or len(api) != 1:
            review.extend({"posterRow": line, "title": row["제목"], "reason": "missing_or_ambiguous_title_venue"} for line, row in candidates)
            continue
        line, row = candidates[0]
        url = quote(row["연결홈페이지주소"].strip(), safe=":/?&=%#@+;,$")
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.hostname not in {"www.ksponco.or.kr", "ksponco.or.kr"}:
            review.append({"posterRow": line, "title": row["제목"], "reason": "unsupported_image_url"})
            continue
        matches.append({"eventId": api[0]["id"], "imageUrl": url, "posterId": row["공연포스터 일련번호"], "posterRow": line,
                        "scheduleRaw": row["공연일"].strip(), "posterTitle": row["제목"], "venueRaw": row["공연장소"],
                        "dataAsOf": row["데이터 기준일"], "matchMethod": "unique_normalized_title_and_venue"})
    return matches, review


def build_catalog(events, posters):
    linked, review = match_posters(events, posters)
    by_row = {item["posterRow"]: item for item in linked}
    titles = {normalize(event["title"]) for event in events}
    standalone, all_posters, held = [], [], []
    ids = set()
    for line, row in enumerate(posters, 2):
        if line in by_row:
            all_posters.append(by_row[line])
            continue
        url = quote(row["연결홈페이지주소"].strip(), safe=":/?&=%#@+;,$")
        parsed = urlparse(url)
        reason = exclusion_reason(row["제목"])
        if normalize(row["제목"]) in titles:
            reason = "unresolved_api_match"
        if parsed.scheme != "https" or parsed.hostname not in {"www.ksponco.or.kr", "ksponco.or.kr"}:
            reason = "unsupported_image_url"
        event_id = "official-poster-" + row["공연포스터 일련번호"].strip()
        if event_id in ids:
            reason = "duplicate_poster_id"
        ids.add(event_id)
        if reason:
            held.append({"posterRow": line, "title": row["제목"], "reason": reason})
            continue
        standalone.append({"id": event_id, "title": row["제목"].strip(), "venue": normalize_venue(row["공연장소"]), "startDate": None, "sourceRows": [line]})
        all_posters.append({"eventId": event_id, "imageUrl": url, "posterId": row["공연포스터 일련번호"], "posterRow": line, "scheduleRaw": row["공연일"].strip(), "posterTitle": row["제목"], "venueRaw": row["공연장소"], "dataAsOf": row["데이터 기준일"], "matchMethod": "standalone_official_poster_record"})
    return linked, standalone, all_posters, held


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
    matches, standalone, all_posters, review = build_catalog(events, posters)
    payload = {"sourceName": "한국체육산업개발주식회사 공연 포스터 정보", "sourceFile": args.poster_csv.name, "sourceSha256": hashlib.sha256(data).hexdigest(), "matches": all_posters}
    (ROOT / "src/data/official-posters.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "src/data/official-poster-events.json").write_text(json.dumps({"sourceName": payload["sourceName"], "events": standalone}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {"posterRows": len(posters), "matched": len(matches), "standalone": len(standalone), "publishedPosters": len(all_posters), "review": review}
    output = ROOT / "data/processed/poster-match-report.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "review"}))


if __name__ == "__main__":
    main()
