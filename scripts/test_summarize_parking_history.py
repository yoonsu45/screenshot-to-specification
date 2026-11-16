import unittest
from summarize_parking_history import summarize


class ParkingHistoryTest(unittest.TestCase):
    def test_recorded_entries_are_not_deduplicated_and_bad_exit_does_not_drop_entry(self):
        entry = {"입차일": "2024-07-01", "입차일시": "2024-07-01 12:00", "출차일시": "2024-07-01 11:00"}
        result = summarize([], [entry, entry], [])
        self.assertEqual(result["flow"]["validEntries"], 2)
        self.assertEqual(result["flow"]["durationSamples"], 0)
        self.assertEqual(result["flow"]["hours"][12]["dailyAverage"], 2)

    def test_id_conflicts_are_excluded_and_tied_statuses_are_kept_as_conflicts(self):
        base = {"주차장아이디": "3", "주차구역": "P2", "혼잡도": "원활", "등록일": "2026-01-01", "등록시간": "12:00:00"}
        rows = [base, {**base, "혼잡도": "만차"}, {**base, "주차구역": "P5"}]
        result = summarize([], [], rows)["congestion"]
        self.assertEqual(result["rejectedRows"], 1)
        self.assertEqual(result["latestByZone"][0]["statuses"], ["원활", "만차"])


if __name__ == "__main__":
    unittest.main()
