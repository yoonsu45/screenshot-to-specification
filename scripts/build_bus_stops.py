"""Build a small park-area snapshot from the two Seoul bus workbooks."""
import argparse
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def rows(path):
    with ZipFile(path) as book:
        strings = ["".join(item.itertext()) for item in ET.fromstring(book.read("xl/sharedStrings.xml"))]
        with book.open("xl/worksheets/sheet1.xml") as sheet:
            for _, row in ET.iterparse(sheet, events=("end",)):
                if not row.tag.endswith("}row"):
                    continue
                values = {}
                for cell in row:
                    column = "".join(c for c in cell.attrib["r"] if c.isalpha())
                    value = cell.find("x:v", NS)
                    if value is not None:
                        values[column] = strings[int(value.text)] if cell.get("t") == "s" else value.text
                if row.get("r") != "1":
                    yield values
                row.clear()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("stops")
    parser.add_argument("routes")
    args = parser.parse_args()
    stops = {}
    for row in rows(args.stops):
        try:
            longitude, latitude = float(row["D"]), float(row["E"])
            if 127.095 <= longitude <= 127.145 and 37.505 <= latitude <= 37.535:
                stops[row["A"]] = {"id": row["A"], "number": row.get("B", "").zfill(5), "name": row["C"], "latitude": latitude, "longitude": longitude, "routes": set()}
        except (KeyError, ValueError):
            continue
    for row in rows(args.routes):
        if row.get("D") in stops and row.get("B"):
            stops[row["D"]]["routes"].add(row["B"])
    result = []
    for stop in stops.values():
        if stop["routes"]:
            stop["routes"] = sorted(stop["routes"], key=lambda route: (len(route), route))
            result.append(stop)
    Path("src/data/seoul-bus-stops.json").write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(result)} stops with routes")


if __name__ == "__main__":
    main()
