"""Build a small, auditable historical summary; never derive live occupancy."""
import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime
import io
import json
from pathlib import Path
from statistics import median


def read_rows(path):
    raw = Path(path).read_bytes()
    for encoding in ("utf-8-sig", "cp949"):
        try:
            return list(csv.DictReader(io.StringIO(raw.decode(encoding))))
        except UnicodeDecodeError:
            continue
    raise ValueError("Unsupported CSV encoding")


def summarize(monthly, flow, congestion):
    months = []
    for row in monthly:
        year, month, total = int(row["연도"]), int(row["월"].removesuffix("월")), int(row["주차대수"])
        if not 1 <= month <= 12 or total < 0:
            raise ValueError("Invalid monthly record")
        if row["주차장소"] == "올림픽공원":
            months.append({"year": year, "month": month, "total": total})
    if len({(r["year"], r["month"]) for r in months}) != len(months):
        raise ValueError("Duplicate monthly record")

    hours = Counter()
    dates = set()
    durations = []
    rejected_flow = 0
    for row in flow:
        try:
            entered = datetime.strptime(row["입차일시"], "%Y-%m-%d %H:%M")
            if entered.strftime("%Y-%m-%d") != row["입차일"]:
                raise ValueError("Date mismatch")
        except (ValueError, KeyError):
            rejected_flow += 1
            continue
        dates.add(entered.strftime("%Y-%m-%d"))
        hours[entered.hour] += 1
        try:
            exited = datetime.strptime(row["출차일시"], "%Y-%m-%d %H:%M")
            minutes = (exited - entered).total_seconds() / 60
            if minutes >= 0:
                durations.append(minutes)
        except (ValueError, KeyError):
            pass

    # Majority mapping is only a validation rule; ambiguous IDs are excluded.
    mappings = defaultdict(Counter)
    for row in congestion:
        mappings[row["주차장아이디"]][row["주차구역"]] += 1
    canonical = {}
    for identity, counts in mappings.items():
        ordered = counts.most_common()
        if len(ordered) == 1 or ordered[0][1] > ordered[1][1]:
            canonical[identity] = ordered[0][0]
    latest, accepted_dates = {}, []
    rejected_congestion = 0
    for row in congestion:
        try:
            at = datetime.strptime(row["등록일"] + " " + row["등록시간"], "%Y-%m-%d %H:%M:%S")
            zone, status = row["주차구역"], row["혼잡도"]
            if canonical.get(row["주차장아이디"]) != zone or status not in ("원활", "혼잡", "만차"):
                raise ValueError("Conflicting mapping")
        except (ValueError, KeyError):
            rejected_congestion += 1
            continue
        stamp = at.strftime("%Y-%m-%d %H:%M:%S")
        accepted_dates.append(stamp)
        old = latest.get(zone)
        if old is None or stamp > old["at"]:
            latest[zone] = {"zone": zone, "at": stamp, "statuses": [status]}
        elif stamp == old["at"] and status not in old["statuses"]:
            old["statuses"].append(status)
    return {
        "monthly": {"sourceFile": "한국체육산업개발주식회사_월별주차현황_20251231.csv", "sourceRows": len(monthly), "rows": sorted(months, key=lambda r: (r["year"], r["month"]))},
        "flow": {"sourceFile": "한국체육산업개발주식회사_올림픽공원 입출차 정보_20240731.csv", "sourceRows": len(flow), "validEntries": sum(hours.values()), "rejectedEntries": rejected_flow, "durationSamples": len(durations), "medianStayMinutes": median(durations) if durations else None, "start": min(dates) if dates else None, "end": max(dates) if dates else None, "days": len(dates), "hours": [{"hour": h, "entries": hours[h], "dailyAverage": round(hours[h] / len(dates), 1) if dates else None} for h in range(24)]},
        "congestion": {"sourceFile": "한국체육산업개발주식회사_주차장 혼잡도 정보_20260812.csv", "sourceRows": len(congestion), "rejectedRows": rejected_congestion, "start": min(accepted_dates) if accepted_dates else None, "end": max(accepted_dates) if accepted_dates else None, "latestByZone": sorted(latest.values(), key=lambda r: r["zone"])},
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--monthly", required=True)
    parser.add_argument("--flow", required=True)
    parser.add_argument("--congestion", required=True)
    parser.add_argument("--output", default="src/data/parking-history.json")
    args = parser.parse_args()
    result = summarize(read_rows(args.monthly), read_rows(args.flow), read_rows(args.congestion))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"monthlyRows": len(result["monthly"]["rows"]), "flowEntries": result["flow"]["validEntries"], "excludedCongestionRows": result["congestion"]["rejectedRows"]}))
