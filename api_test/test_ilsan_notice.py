
import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs

# 1. 일산올림픽스포츠센터 공지사항 주소
url = "https://www.ksponco.or.kr/sports/board.es"

params = {
    "bid": "0014",
    "mid": "a90301000000"
}

# 2. 홈페이지 요청

try:
    response = requests.get(
        url,
        params=params,
        timeout=(10, 30)
    )
    response.raise_for_status()

    print("서버 연결 성공:", response.status_code)

except requests.exceptions.Timeout:
    print("오류: 서버 연결 또는 응답 시간이 초과되었습니다.")
    raise

except requests.exceptions.RequestException as e:
    print("요청 오류:", e)
    raise

response.raise_for_status()
response.encoding = response.apparent_encoding

print("응답 상태 코드:", response.status_code)

# 3. HTML 분석
soup = BeautifulSoup(response.text, "html.parser")

# 4. 공지사항 제목, 등록일, 링크 추출
notice_data = []

for row in soup.select("tr"):

    title_tag = row.select_one("td.title a")
    date_tag = row.select_one('td[data-title="Date"]')

    if title_tag and date_tag:

        title = title_tag.get_text(" ", strip=True)
        date = date_tag.get_text(strip=True)

        href = title_tag.get("href", "")
        full_url = urljoin(response.url, href)

        # 게시물 번호 추출
        query = parse_qs(urlparse(full_url).query)
        notice_id = query.get("list_no", [""])[0]

        notice_data.append({
            "notice_id": notice_id,
            "title": title,
            "regDate": date,
            "url": full_url,
            "facility": "일산올림픽스포츠센터"
        })

# 5. 데이터프레임 생성
df_ilsan = pd.DataFrame(notice_data)

print("\n=== 일산스포츠센터 공지사항 ===")

if df_ilsan.empty:
    print("공지사항을 추출하지 못했습니다.")
    print("HTML 구조를 확인해야 합니다.")
else:
    print(df_ilsan[["title", "regDate"]].to_string(index=False))

print("\n=== 수집 건수 ===")
print(len(df_ilsan))

# -------------------------
""" 일산스포츠센터 포스터 이미지 url 추출"""


import time
from urllib.parse import urljoin

# 이미지 URL 저장
image_urls_all = []

for index, row in df_ilsan.iterrows():

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

        # 상세페이지에서 이미지 찾기
        image_urls = []

        for img in detail_soup.find_all("img"):
            src = img.get("src", "")
            img_url = urljoin(detail_url, src)

            if "/sports/html/" in img_url:
                image_urls.append(img_url)

        # 첫 번째 이미지 저장
        if image_urls:
            image_urls_all.append(image_urls[0])
        else:
            image_urls_all.append(None)

        print(f"{index + 1}/{len(df_ilsan)} 확인 완료")

        time.sleep(1)

    except requests.RequestException as e:
        print(f"요청 실패: {e}")
        image_urls_all.append(None)

# 이미지 URL 컬럼 추가
df_ilsan["image_url"] = image_urls_all

print("\n=== 일산 이미지 URL 수집 결과 ===")
print(df_ilsan[["title", "image_url"]].to_string(index=False))

print("\n=== 이미지 URL 확보 건수 ===")
print(df_ilsan["image_url"].notna().sum())

# ---------------------------------------------
"""일산스포츠센터 데이터 csv 파일로 저장"""

from pathlib import Path

# 프로젝트 최상위 폴더
project_dir = Path(__file__).resolve().parent.parent

# 데이터 저장 폴더
data_dir = project_dir / "data"
data_dir.mkdir(exist_ok=True)

# 저장 파일 경로
file_path = data_dir / "ilsan_sports_notices.csv"

# CSV 파일로 저장
df_ilsan.to_csv(
    file_path,
    index=False,
    encoding="utf-8-sig"
)

print("\n=== CSV 저장 완료 ===")
print("저장 경로:", file_path)
print("저장 건수:", len(df_ilsan))
print("이미지 URL 확보 건수:", df_ilsan["image_url"].notna().sum())
