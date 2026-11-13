
import os
import requests
from dotenv import load_dotenv

# 1. .env 파일에서 API 인증키 불러오기
load_dotenv()

api_key = os.getenv("KCISA_API_KEY")

if not api_key:
    raise ValueError("API 인증키를 찾을 수 없습니다.")

# 2. 한국체육산업개발 공연정보 API 주소
url = "https://api.kcisa.kr/openapi/service/rest/meta/KSCperf"

# 3. API 요청에 필요한 값
params = {
    "serviceKey": api_key,
    "numOfRows": 10,
    "pageNo": 1
}

# 4. API 서버에 데이터 요청
response = requests.get(url, params=params, timeout=20)

# 5. 결과 확인
print("응답 상태 코드:", response.status_code)
print("\n=== API 응답 데이터 ===")
print(response.text[:3000])

# ----------------------------------------------------

import pandas as pd
import xml.etree.ElementTree as ET

# XML 데이터를 파싱하기
root = ET.fromstring(response.content)

# 공연정보(item) 추출
items = root.findall(".//item")

# 각 공연정보를 딕셔너리로 변환
data = []

for item in items:
    row = {}

    for child in item:
        row[child.tag] = child.text

    data.append(row)

# 데이터프레임 생성
df = pd.DataFrame(data)

# 결과 출력
print("\n=== 공연 데이터 ===")
print(df.head())

# 컬럼 목록 확인
print("\n=== 컬럼 목록 ===")
print(df.columns.tolist())

# 데이터 크기 확인
print("\n=== 데이터 크기 ===")
print(df.shape)

# --------------------------------------------

# 행사명, 장소, 기간 확인
print("\n=== 행사 핵심 정보 ===")

print(
    df[["title", "spatial", "temporalCoverage"]]
    .to_string(index=False)
)

# ---------------------------------------------------

# API 데이터 등록일 확인
print("\n=== 행사별 등록일 ===")
print(df[["title", "regDate"]].to_string(index=False))

# 등록일을 날짜 형식으로 변환
df["regDate_dt"] = pd.to_datetime(
    df["regDate"],
    errors="coerce"
)

# 가장 최근 등록일 확인
print("\n=== 현재 10건 중 가장 최근 등록일 ===")
print(df["regDate_dt"].max())

# -----------------------------------------------------

# API 전체 데이터 건수 확인
print("\n=== API 전체 데이터 건수 ===")

total_count = root.findtext(".//totalCount")

if total_count is not None:
    print("전체 공연 데이터:", total_count, "건")
else:
    print("전체 건수를 찾지 못했습니다.")
    print("응답 구조를 추가로 확인해야 합니다.")

# ------------------------------------------------------

# 전체 공연 데이터 수집
print("\n=== 전체 공연 데이터 수집 시작 ===")

all_data = []

# 전체 페이지 수 계산
total_pages = (int(total_count) + 99) // 100

for page in range(1, total_pages + 1):

    params = {
        "serviceKey": api_key,
        "numOfRows": 100,
        "pageNo": page
    }

    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()

    page_root = ET.fromstring(response.content)
    page_items = page_root.findall(".//item")

    for item in page_items:
        row = {}

        for child in item:
            row[child.tag] = child.text

        all_data.append(row)

    print(f"{page}/{total_pages} 페이지 수집 완료")

# 전체 데이터를 데이터프레임으로 변환
df_all = pd.DataFrame(all_data)

print("\n=== 전체 데이터 크기 ===")
print(df_all.shape)

# 등록일 확인
df_all["regDate_dt"] = pd.to_datetime(
    df_all["regDate"],
    errors="coerce"
)

print("\n=== 가장 최근 등록일 ===")
print(df_all["regDate_dt"].max())

# 연도별 등록 건수 확인
print("\n=== 등록 연도별 건수 ===")
print(df_all["regDate_dt"].dt.year.value_counts().sort_index())


## 실제 행사 개최 연도 확인하기

# 공연 날짜 관련 데이터 확인
print("\n=== 공연 날짜 정보 확인 ===")

print(
    df_all[
        ["title", "temporalCoverage", "description"]
    ].tail(10).to_string(index=False, max_colwidth=60)
)

# 데이터가 등록된 시간의 분포 확인
print("\n=== 등록 날짜별 데이터 건수 ===")

print(
    df_all["regDate_dt"]
    .dt.date
    .value_counts()
    .sort_index()
)
# ---------------------------------------------------------

from pathlib import Path

# 프로젝트 최상위 폴더 경로
project_dir = Path(__file__).resolve().parent.parent

# 데이터 저장 폴더 만들기
data_dir = project_dir / "data"
data_dir.mkdir(exist_ok=True)

# CSV 파일로 저장
file_path = data_dir / "kspo_performances.csv"

df_all.to_csv(
    file_path,
    index=False,
    encoding="utf-8-sig"
)

print("\n=== CSV 저장 완료 ===")
print("저장 경로:", file_path)
print("저장 건수:", len(df_all))
 