import unittest
from match_official_posters import match_posters, build_catalog, venue_key


class PosterMatchTests(unittest.TestCase):
    def test_aliases_and_standalone_source(self):
        self.assertEqual(venue_key("KSPODOME(체조경기장)"), venue_key("KSPO DOME"))
        self.assertEqual(venue_key("올림픽공원 내 올림픽홀"), venue_key("올림픽홀"))
        self.assertEqual(venue_key("우리금융아트홀(올림픽역도경기장)"), venue_key("우리금융아트홀"))
        matched, standalone, posters, held = build_catalog([], [self.poster()])
        self.assertEqual(matched, [])
        self.assertEqual(standalone[0]["id"], "official-poster-1")
        self.assertEqual(posters[0]["matchMethod"], "standalone_official_poster_record")
        self.assertEqual(held, [])

    def test_ambiguous_existing_title_is_not_added_as_duplicate(self):
        event = [{"id": "api-1", "title": "테스트 공연", "venue": "KSPO DOME"}]
        _, standalone, _, held = build_catalog(event, [self.poster(), self.poster()])
        self.assertEqual(standalone, [])
        self.assertEqual(len(held), 2)

    def poster(self, **extra):
        return {"제목": "테스트 공연", "공연장소": "올림픽공원 체조경기장", "연결홈페이지주소": "https://www.ksponco.or.kr/poster.jpg", "공연포스터 일련번호": "1", "공연일": "2012-01-02", "데이터 기준일": "2025-05-08", **extra}

    def test_unique_title_and_venue(self):
        matches, review = match_posters([{"id": "api-1", "title": "테스트공연", "venue": "KSPO DOME"}], [self.poster()])
        self.assertEqual(matches[0]["eventId"], "api-1")
        self.assertEqual(matches[0]["scheduleRaw"], "2012-01-02")
        self.assertEqual(review, [])

    def test_ambiguous_matches_stay_unlinked(self):
        events = [{"id": str(i), "title": "테스트 공연", "venue": "KSPO DOME"} for i in range(2)]
        self.assertEqual(match_posters(events, [self.poster()])[0], [])
        self.assertEqual(match_posters(events[:1], [self.poster(), self.poster()])[0], [])

    def test_different_venue_and_unsafe_url(self):
        event = [{"id": "api-1", "title": "테스트 공연", "venue": "KSPO DOME"}]
        for poster in [self.poster(공연장소="올림픽홀"), self.poster(연결홈페이지주소="https://example.com/poster.jpg")]:
            self.assertEqual(match_posters(event, [poster])[0], [])


if __name__ == "__main__":
    unittest.main()
