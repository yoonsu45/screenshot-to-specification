
import requests
from bs4 import BeautifulSoup

# 1. 분당올림픽스포츠센터 공지사항 주소
url = "https://www.ksponco.or.kr/sports/board.es"

# 2. 페이지 요청에 필요한 값
params = {
    "bid": "0017",
    "mid": "b10301000000"
}

# 3. 홈페이지에 접속
response = requests.get(
    url,
    params=params,
    timeout=20
)

print("응답 상태 코드:", response.status_code)
response.raise_for_status()

# 4. HTML 데이터 분석
response.encoding = response.apparent_encoding
soup = BeautifulSoup(response.text, "html.parser")

# 5. 특정 행사명 검색
keyword = "원데이클래스"

if keyword in soup.get_text(" ", strip=True):
    print("성공! 원데이클래스 공지를 찾았습니다.")
else:
    print("원데이클래스 공지를 찾지 못했습니다.")

# 6. 페이지 제목 확인
print("페이지 제목:", soup.title.get_text(strip=True) if soup.title else "없음")


# -----------------------------------
"""공지사항 HTML 구조 확인"""

# 원데이클래스 문구가 포함된 HTML 요소 찾기
print("\n=== 원데이클래스 관련 HTML ===")

for tag in soup.find_all("a"):
    if "원데이클래스" in tag.get_text(" ", strip=True):
        print(tag.prettify()[:2000])
        print("-" * 50)

# --------------------------------
"""공지사항 제목과 링크 추출"""

import pandas as pd
from urllib.parse import urljoin, urlparse, parse_qs

# 공지사항 제목과 링크 저장
notices = []

for tag in soup.find_all("a"):

    href = tag.get("href", "")
    title = tag.get_text(" ", strip=True)

    # 게시물 상세보기 링크만 추출
    if "act=view" in href and "list_no=" in href:

        full_url = urljoin(url, href)

        # 게시물 번호 추출
        query = parse_qs(urlparse(full_url).query)
        notice_id = query.get("list_no", [""])[0]

        notices.append({
            "notice_id": notice_id,
            "title": title,
            "url": full_url
        })

# 데이터프레임 생성
df_notices = pd.DataFrame(notices)

# 결과 확인
print("\n=== 공지사항 목록 ===")
print(df_notices.to_string(index=False))

print("\n=== 수집 건수 ===")
print(len(df_notices))

# ---------------------------------
"""공지사항 등록일 확인"""

# 특정 공지사항의 HTML 구조 확인
print("\n=== 공지사항 등록일 구조 확인 ===")

target = soup.find(
    "a",
    string=lambda text: text and "11월 무료 원데이클래스" in text
)

if target:
    # 상위 HTML 요소 확인
    print(target.parent.parent.prettify()[:3000])
else:
    print("해당 공지를 찾지 못했습니다.")

# --------------------------------------
"""공지사항 등록일 추가"""

# 공지사항 제목, 등록일, 링크 한 번에 추출
notice_data = []

for row in soup.select("tr"):

    title_tag = row.select_one("td.title a")
    date_tag = row.select_one('td[data-title="Date"]')

    # 제목과 등록일이 있는 행만 선택
    if title_tag and date_tag:

        title = title_tag.get_text(strip=True)
        date = date_tag.get_text(strip=True)

        href = title_tag.get("href", "")
        full_url = urljoin(url, href)

        notice_data.append({
            "title": title,
            "regDate": date,
            "url": full_url
        })

# 데이터프레임으로 변환
df_notice = pd.DataFrame(notice_data)

print("\n=== 분당스포츠센터 공지사항 ===")
print(df_notice[["title", "regDate"]].to_string(index=False))

print("\n=== 공지사항 수집 건수 ===")
print(len(df_notice))

# -----------------------
"""파이썬에서 포스터 이미지 주소 출력"""

# 특정 공지사항의 상세페이지 조회
target_url = (
    "https://www.ksponco.or.kr/sports/board.es"
    "?mid=b10301000000&bid=0017"
    "&act=view&list_no=85773&nPage=1"
)

detail_response = requests.get(target_url, timeout=20)
detail_response.raise_for_status()

detail_response.encoding = detail_response.apparent_encoding

detail_soup = BeautifulSoup(
    detail_response.text,
    "html.parser"
)

# 상세페이지에 있는 이미지 주소 찾기
print("\n=== 상세페이지 이미지 목록 ===")

for img in detail_soup.find_all("img"):

    src = img.get("src", "")

    # 이미지 주소를 절대경로로 변환
    img_url = urljoin(target_url, src)

    if "/sports/html/" in img_url:
        print(img_url)

# ----------------------------------------
"""공지사항과 포스터 URL 통합"""

# 기존 공지사항 데이터프레임 복사
df_final = df_notice.copy()

# 포스터 이미지 URL을 저장할 컬럼
df_final["image_url"] = None

# 원데이클래스 공지의 이미지 URL 연결
target_id = "85773"

image_urls = []

for img in detail_soup.find_all("img"):
    src = img.get("src", "")
    img_url = urljoin(target_url, src)

    if "/sports/html/" in img_url:
        image_urls.append(img_url)

# 해당 공지에 이미지 URL 추가
if image_urls:
    df_final.loc[
        df_final["url"].str.contains(
            f"list_no={target_id}",
            regex=False
        ),
        "image_url"
    ] = image_urls[0]

# 결과 출력
print("\n=== 행사 데이터 통합 결과 ===")

print(
    df_final[
        ["title", "regDate", "image_url"]
    ].to_string(index=False)
)

print("\n=== 이미지 URL 확보 건수 ===")
print(df_final["image_url"].notna().sum())

# -----------------------
"""전체 공지사항의 이미지 URL 수집"""

import time

# 전체 공지사항 데이터 복사
df_images = df_notice.copy()

# 이미지 URL 저장용 리스트
all_image_urls = []

for index, row in df_images.iterrows():

    # 상세페이지 주소
    detail_url = row["url"]

    try:
        # 상세페이지 요청
        res = requests.get(detail_url, timeout=20)
        res.raise_for_status()
        res.encoding = res.apparent_encoding

        # HTML 파싱
        detail = BeautifulSoup(res.text, "html.parser")

        # 본문 이미지 주소 추출
        image_urls = []

        for img in detail.find_all("img"):
            src = img.get("src", "")
            img_url = urljoin(detail_url, src)

            if "/sports/html/" in img_url:
                image_urls.append(img_url)

        # 이미지가 있다면 첫 번째 이미지 저장
        if image_urls:
            all_image_urls.append(image_urls[0])
        else:
            all_image_urls.append(None)

        print(f"{index + 1}/{len(df_images)} 확인 완료")

        # 서버에 부담을 주지 않도록 요청 간격 설정
        time.sleep(1)

    except requests.RequestException as e:
        print(f"요청 실패: {detail_url} ({e})")
        all_image_urls.append(None)

# 데이터프레임에 이미지 URL 추가
df_images["image_url"] = all_image_urls

# 결과 확인
print("\n=== 전체 이미지 수집 결과 ===")
print(df_images[["title", "image_url"]].to_string(index=False))

print("\n=== 이미지 URL 확보 건수 ===")
print(df_images["image_url"].notna().sum())

# -----------------------------------
"""수집 데이터를 csv로 저장"""

from pathlib import Path

# 프로젝트 최상위 폴더
project_dir = Path(__file__).resolve().parent.parent

# 데이터 저장 폴더
data_dir = project_dir / "data"
data_dir.mkdir(exist_ok=True)

# 시설명 추가
df_images["facility"] = "분당올림픽스포츠센터"

# CSV 저장 경로
file_path = data_dir / "bundang_sports_notices.csv"

# CSV 저장
df_images.to_csv(
    file_path,
    index=False,
    encoding="utf-8-sig"
)

print("\n=== CSV 저장 완료 ===")
print("저장 경로:", file_path)
print("저장 건수:", len(df_images))
print("이미지 URL 확보 건수:", df_images["image_url"].notna().sum())
