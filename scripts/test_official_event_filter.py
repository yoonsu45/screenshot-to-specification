import unittest
from export_official_events import exclusion_reason


class OfficialEventFilterTests(unittest.TestCase):
    def test_booking_and_facility_status(self):
        for title in ["예약완료", "예약 완료", "준비대관", "철거대관", "대관예정", "행사철거", "무대점검", "내부공사", "시설물 작업", "시설보수", "무대바턴와이어교체 및 점검"]:
            with self.subTest(title=title):
                self.assertIsNotNone(exclusion_reason(title))

    def test_weekly_summaries_and_availability(self):
        for title in ["주간행사 계획(3.19-3.25)", "주간계획(8.6-8.12)", "옥외 주간행사 계획(9.12-9.18)", "주간 옥외 행사 계획(5.23-5.29)", "주간행사 기획(4.2-4.8)", "2013년 수시대관 예약가능 일정"]:
            with self.subTest(title=title):
                self.assertIsNotNone(exclusion_reason(title))

    def test_real_titles_are_not_removed_by_broad_keyword_matching(self):
        for title in ["이승환 열세번째＇차카게 살자＇ 순수주간", "YTN 특별기획 이승환 힐링콘서트", "기획공연 지젤", "예약완료 콘서트", "주간의 꿈 콘서트", "봄여름가을겨울 브라보마이라이프 10주년 콘서트"]:
            with self.subTest(title=title):
                self.assertIsNone(exclusion_reason(title))


if __name__ == "__main__":
    unittest.main()
