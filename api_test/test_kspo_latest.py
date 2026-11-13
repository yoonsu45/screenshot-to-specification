
import requests
import pandas as pd

# 올림픽공원 홈페이지의 행사정보 요청 주소
url = "https://www.ksponco.or.kr/olympicpark/eventInfo/eventInfoListAjax.es"

# 2026년 12월 전체 공연장 조회
payload = {
    "nowYM": "202612",
    "plcCd": ""
}

# 서버에 POST 요청
response = requests.post(
    url,
    json=payload,
    timeout=20
)

print("응답 상태 코드:", response.status_code)
response.raise_for_status()

# JSON 데이터 변환
data = response.json()

print("\n=== 응답 자료형 ===")
print(type(data))

print("\n=== 데이터 미리보기 ===")
print(str(data)[:1000])

# ----------------------------------
""" JSON을 표 형태로 변환"""

# JSON에서 공연정보 목록 추출
events = data[0]

# 데이터프레임으로 변환
df = pd.DataFrame(events)

# 핵심 컬럼만 선택
columns = [
    "evtSeq",
    "title",
    "beginDt",
    "endDt",
    "tm",
    "plc",
    "tktPrc",
    "evtLink"
]

df_events = df[columns]

# 공연정보 출력
print("\n=== 2026년 12월 공연정보 ===")
print(df_events.to_string(index=False))

# 공연 개수 확인
print("\n=== 공연 건수 ===")
print(len(df_events))

# 컬럼 목록 확인
print("\n=== 컬럼 목록 ===")
print(df_events.columns.tolist())

# ------------------------------
"""여러 달의 행사 정보 수집"""

# 2026년 11월, 12월 공연정보 수집
months = ["202611", "202612"]

all_events = []

for month in months:

    payload = {
        "nowYM": month,
        "plcCd": ""
    }

    response = requests.post(
        url,
        json=payload,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    events = data[0]

    all_events.extend(events)

    print(f"{month} 수집 완료: {len(events)}건")

# 데이터프레임 생성
df_all = pd.DataFrame(all_events)

# 행사 고유번호 기준 중복 제거
df_all = df_all.drop_duplicates(subset="evtSeq")

# 핵심 정보만 출력
print("\n=== 전체 공연정보 ===")

print(
    df_all[
        ["title", "beginDt", "endDt", "plc"]
    ].to_string(index=False)
)

print("\n=== 총 공연 건수 ===")
print(len(df_all))

# ----------------------------------
"""최신 공연정보를 csv로 저장"""

from pathlib import Path

# 프로젝트 최상위 폴더
project_dir = Path(__file__).resolve().parent.parent

# 데이터 저장 폴더
data_dir = project_dir / "data"
data_dir.mkdir(exist_ok=True)

# 저장할 파일 이름
file_path = data_dir / "kspo_latest_events.csv"

# CSV 저장
df_all.to_csv(
    file_path,
    index=False,
    encoding="utf-8-sig"
)

print("\n=== CSV 저장 완료 ===")
print("저장 경로:", file_path)
print("저장 건수:", len(df_all))
