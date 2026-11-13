
import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# 올림픽수영장 공지사항
url = "https://www.ksponco.or.kr/sports/board.es"

params = {
    "mid": "a50301000000",
    "bid": "0001"
}

# 홈페이지 연결
response = requests.get(
    url,
    params=params,
    timeout=(10, 30)
)

response.raise_for_status()
response.encoding = response.apparent_encoding

print("응답 상태 코드:", response.status_code)

# HTML 분석
soup = BeautifulSoup(response.text, "html.parser")

# 공지사항 추출
notices = []

for row in soup.select("tr"):
    title_tag = row.select_one("td.title a")
    date_tag = row.select_one('td[data-title="Date"]')

    if title_tag and date_tag:
        notices.append({
            "title": title_tag.get_text(" ", strip=True),
            "regDate": date_tag.get_text(strip=True),
            "url": urljoin(response.url, title_tag.get("href", "")),
            "facility": "올림픽수영장"
        })

# 데이터프레임 변환
df_swimming = pd.DataFrame(notices)

print("\n=== 올림픽수영장 공지사항 ===")

if df_swimming.empty:
    print("공지사항이 추출되지 않았습니다.")
    print("HTML 구조를 추가로 확인해야 합니다.")
else:
    print(df_swimming[["title", "regDate"]].to_string(index=False))

print("\n=== 수집 건수 ===")
print(len(df_swimming))

# ---------------------------
"""올림픽수영장 포스터 이미지 url 추출"""

import time

# 상세페이지 이미지 URL 수집
image_urls_all = []

for index, row in df_swimming.iterrows():

    detail_url = row["url"]

    try:
        res = requests.get(
            detail_url,
            timeout=(10, 30)
        )
        res.raise_for_status()
        res.encoding = res.apparent_encoding

        detail_soup = BeautifulSoup(
            res.text,
            "html.parser"
        )

        image_urls = []

        for img in detail_soup.find_all("img"):
            src = img.get("src", "")
            img_url = urljoin(detail_url, src)

            if "/sports/html/" in img_url:
                image_urls.append(img_url)

        if image_urls:
            image_urls_all.append(image_urls[0])
        else:
            image_urls_all.append(None)

        print(f"{index + 1}/{len(df_swimming)} 확인 완료")
        time.sleep(1)

    except requests.RequestException as e:
        print(f"요청 실패: {e}")
        image_urls_all.append(None)

# 데이터프레임에 이미지 URL 추가
df_swimming["image_url"] = image_urls_all

print("\n=== 올림픽수영장 이미지 URL 수집 결과 ===")
print(df_swimming[["title", "image_url"]].to_string(index=False))

print("\n=== 이미지 URL 확보 건수 ===")
print(df_swimming["image_url"].notna().sum())

#----------------------------------
"""올림픽수영장 데이터를 csv파일로 저장"""

from pathlib import Path

# 프로젝트 최상위 폴더
project_dir = Path(__file__).resolve().parent.parent

# 데이터 저장 폴더 생성
data_dir = project_dir / "data"
data_dir.mkdir(exist_ok=True)

# CSV 저장 경로
file_path = data_dir / "olympic_swimming_notices.csv"

# CSV 저장
df_swimming.to_csv(
    file_path,
    index=False,
    encoding="utf-8-sig"
)

print("\n=== CSV 저장 완료 ===")
print("저장 경로:", file_path)
print("저장 건수:", len(df_swimming))
print("이미지 URL 확보 건수:", df_swimming["image_url"].notna().sum())
