import { useQuery } from "@tanstack/react-query";
import { getSeoulParking } from "@/lib/parking-api";
import { getSeoulAvailability } from "@/lib/seoul-parking";
import { openNaverMapPlace, openNaverMapSearch } from "@/lib/naver-map";

export function SeoulParkingGuide() {
  return <details className="rounded-xl border border-border bg-card">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
      <span><span className="block font-extrabold">공원 밖 대체 주차장</span><span className="mt-1 block text-xs text-muted-foreground">서울시 연계 · 잔여 대수 순</span></span>
      <span className="shrink-0 text-xs font-bold text-primary">펼치기 / 접기</span>
    </summary>
    <SeoulParkingDetails />
  </details>;
}

function SeoulParkingDetails() {
  const query = useQuery({
    queryKey: ["seoul-parking"], queryFn: () => getSeoulParking(),
    staleTime: 60000, refetchInterval: 60000, retry: false,
  });
  const now = Date.now();
  const lots = (query.data?.status === "ok" ? query.data.lots : [])
    .map((lot) => ({ lot, availability: getSeoulAvailability(lot, now) }))
    .sort((a, b) => (b.availability?.remaining ?? -1) - (a.availability?.remaining ?? -1));
  return <div className="border-t border-border p-4">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-extrabold">서울시 주차정보</h3>
      <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="text-xs font-bold disabled:opacity-50">새로고침</button>
    </div>
    <div className="mt-3 space-y-2" aria-live="polite">
      {lots.length > 0 ? lots.map(({ lot, availability }) => {
        return <article key={lot.id} className="rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div><h4 className="font-extrabold">{lot.name}</h4><p className="mt-1 text-xs text-muted-foreground">{lot.address}</p></div>
            <button
              type="button"
              onClick={() => {
                if (lot.latitude !== null && lot.longitude !== null) {
                  openNaverMapPlace({
                    latitude: lot.latitude,
                    longitude: lot.longitude,
                    name: `${lot.name} 주차장`,
                  });
                  return;
                }
                openNaverMapSearch(`${lot.name} ${lot.address}`);
              }}
              className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
              aria-label={`${lot.name} 네이버지도 앱에서 찾기`}
            >
              지도 보기
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div><dt className="text-muted-foreground">현재 혼잡도 · 서비스 산정</dt><dd className={`mt-1 font-bold ${availability?.label === "혼잡" || availability?.label === "만차" ? "text-brand-orange" : "text-primary"}`}>{availability?.label ?? "확인 불가"}</dd></div>
            <div><dt className="text-muted-foreground">잔여 주차 대수 · 계산값</dt><dd className="mt-1 font-bold">{availability ? `${availability.remaining.toLocaleString("ko-KR")}대` : "확인 불가"}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">총 주차면 {lot.capacity?.toLocaleString("ko-KR") ?? "미확인"}{lot.updatedAt ? ` · 자료 기준 ${lot.updatedAt} (한국시간)` : " · 기준 시각 미확인"}</p>
          {!availability && <p className="mt-1 text-xs text-muted-foreground">연계 중단·20분 초과 자료 또는 수치 이상으로 현재 대수를 표시하지 않습니다.</p>}
        </article>;
      }) : <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{query.isFetching ? "서울시 주차정보 조회 중…" : query.data?.status === "missing_key" ? "서울시 주차정보 연결이 아직 설정되지 않았습니다." : query.isError ? "주차정보 서버에 연결하지 못했습니다. 다시 조회해 주세요." : query.data?.status === "ok" ? "현재 조회 결과에 대체 후보 주차장이 없습니다." : "서울시 제공기관의 응답을 확인할 수 없습니다. 잠시 후 다시 조회해 주세요."}</p>}
    </div>
    <p className="mt-2 text-xs leading-5">잔여 대수는 계산값이며 도착 시 빈자리를 보장하지 않습니다. 공연장까지 추가 이동이 필요합니다.</p>
    <a href="https://data.seoul.go.kr/dataList/OA-21709/A/1/datasetView.do" target="_blank" rel="noopener noreferrer" className="text-xs underline">출처: 서울특별시 · 시영주차장 실시간 주차대수 정보</a>
  </div>;
}
