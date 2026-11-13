
import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from pathlib import Path
import time

# 1. 시설별 설정

# 시설별 설정
facilities = [
    {
        "name": "분당올림픽스포츠센터",
        "mid": "b10301000000",
        "bid": "0017"
    },
    {
        "name": "일산올림픽스포츠센터",
        "mid": "a90301000000",
        "bid": "0014"
    },
    {
        "name": "올림픽수영장",
        "mid": "a50301000000",
        "bid": "0001"
    },
    {
        "name": "올림픽공원스포츠센터",
        "mid": "a60301000000",
        "bid": "0005"
    },
    
    {
        "name": "올림픽테니스장",
        "mid": "a70301000000",
        "bid": "0007"
    }

]


# 2. 공지사항 주소
url = "https://www.ksponco.or.kr/sports/board.es"

# 전체 공지사항 저장
all_notices = []

# 3. 시설별로 반복 수집
for facility in facilities:

    print(f"\n=== {facility['name']} 수집 시작 ===")

    params = {
        "mid": facility["mid"],
        "bid": facility["bid"]
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=(10, 30)
        )
        response.raise_for_status()
        response.encoding = response.apparent_encoding

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        count = 0

        # 공지사항 한 행씩 분석
        for row in soup.select("tr"):

            title_tag = row.select_one("td.title a")
            date_tag = row.select_one('td[data-title="Date"]')

            if title_tag and date_tag:

                title = title_tag.get_text(" ", strip=True)
                reg_date = date_tag.get_text(strip=True)

                href = title_tag.get("href", "")
                detail_url = urljoin(response.url, href)

                all_notices.append({
                    "facility": facility["name"],
                    "title": title,
                    "regDate": reg_date,
                    "url": detail_url
                })

                count += 1

        print(f"수집 완료: {count}건")

    except requests.RequestException as e:
        print(f"수집 실패: {facility['name']}")
        print("오류:", e)

    # 서버 요청 간격
    time.sleep(1)

# 4. 통합 데이터프레임 생성
df_all = pd.DataFrame(
    all_notices,
    columns=["facility", "title", "regDate", "url"]
)

print("\n=== 시설별 공지사항 수집 건수 ===")

if not df_all.empty:
    print(df_all.groupby("facility").size())
else:
    print("수집된 데이터가 없습니다.")

print("\n=== 전체 공지사항 건수 ===")
print(len(df_all))

# 5. CSV 파일 저장
project_dir = Path(__file__).resolve().parent.parent
data_dir = project_dir / "data"
data_dir.mkdir(exist_ok=True)

file_path = data_dir / "sports_notices_all.csv"

# 수집에 실패한 시설이 있다면 불완전한 CSV로 덮어쓰지 않기
if not df_all.empty:
    df_all.to_csv(
        file_path,
        index=False,
        encoding="utf-8-sig"
    )
    print("\nCSV 저장 완료:", file_path)

# -------------------------------------
"""통합 데이터에 이미지 url 추가"""

# 6. 공지사항별 이미지 URL 추출
image_urls_all = []

for index, row in df_all.iterrows():

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

        # 첫 번째 이미지 저장
        if image_urls:
            image_urls_all.append(image_urls[0])
        else:
            image_urls_all.append(None)

        print(f"{index + 1}/{len(df_all)} 이미지 확인 완료")
        time.sleep(1)

    except requests.RequestException as e:
        print(f"이미지 URL 확인 실패: {e}")
        image_urls_all.append(None)

# 이미지 URL 컬럼 추가
df_all["image_url"] = image_urls_all

# 7. 이미지 URL 수집 결과 확인
print("\n=== 시설별 이미지 URL 확보 건수 ===")

print(
    df_all.groupby("facility")["image_url"]
    .apply(lambda x: x.notna().sum())
)

print("\n=== 전체 이미지 URL 확보 건수 ===")
print(df_all["image_url"].notna().sum())


# 이미지 URL까지 포함해서 CSV 저장
# 일부 시설의 수집 실패 여부를 먼저 확인한 뒤 저장
if len(df_all) > 0:
    df_all.to_csv(
        file_path,
        index=False,
        encoding="utf-8-sig"
    )

    print("\n=== 최종 CSV 저장 완료 ===")
    print("저장 건수:", len(df_all))
    print("이미지 URL 확보 건수:", df_all["image_url"].notna().sum())
