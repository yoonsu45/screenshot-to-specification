import unittest

from clean_kspo_performances import clean_rows, normalize_venue, text


class CleanupTests(unittest.TestCase):
    def row(self, schedule):
        return {"title": "공연", "spatial": "올림픽홀", "temporalCoverage": schedule, "regDate": "2025-01-02"}

    def test_incomplete_dates_are_not_inferred(self):
        for schedule in ["18:00", ".", "5월 2일", "2025-02-30", "2025년 5월 2일 ~ 3일", "2025-05-02 / 2025-05-04"]:
            with self.subTest(schedule=schedule):
                result = clean_rows([self.row(schedule)])[0]
                self.assertIsNone(result["startDate"])
                self.assertFalse(result["readyForDateComparison"])

    def test_explicit_date_and_provenance(self):
        result = clean_rows([self.row("2024년 2월 29일")])[0]
        self.assertEqual(result["startDate"], "2024-02-29")
        self.assertEqual(result["sourceType"], "official_public_data")
        self.assertFalse(result["isDemo"])

    def test_only_exact_duplicates_are_combined(self):
        first = self.row("2025-05-02")
        second = self.row("2025-05-03")
        result = clean_rows([first, first.copy(), second])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["sourceRows"], [2, 3])
        self.assertNotEqual(result[0]["id"], result[1]["id"])

    def test_text_and_venue(self):
        self.assertEqual(text("<p>A</p><p>B &amp; C</p><script>hidden</script>"), "A B & C")
        self.assertEqual(normalize_venue("올림픽공원 체조경기장"), "KSPO DOME")
        self.assertIsNone(normalize_venue("기타"))


if __name__ == "__main__":
    unittest.main()
