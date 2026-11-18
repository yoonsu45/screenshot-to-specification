import { useQuery } from "@tanstack/react-query";
import { getTsParking } from "@/lib/parking-api";

export function TsParkingGuide() {
  return <details className="border-t border-border pt-3">
    <summary className="cursor-pointer text-sm font-bold">추가 주차정보 · 자세히 보기</summary>
    <TsParkingDetails />
  </details>;
}

function TsParkingDetails() {
  const query = useQuery({ queryKey: ["ts-parking"], queryFn: () => getTsParking(), staleTime: 60000, refetchInterval: 60000, retry: false });
  const source = query.data;
  const fresh = source?.status === "ok" && Date.now() - Date.parse(source.fetchedAt) < 120000;
  return <div className="pt-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold">추가 주차정보 · 한국교통안전공단</h3><button type="button" className="text-xs font-bold disabled:opacity-50" disabled={query.isFetching} onClick={() => void query.refetch()}>새로고침</button></div>
    <p className="my-2 text-xs leading-5 text-muted-foreground">일부 조회 자료 중 관리 ID와 총 주차면 수가 일치하는 인근 공영주차장만 표시합니다. 원자료 측정 시각이 없어 현장 확인이 필요하며, 서울시 자료와 값이 다를 수 있습니다.</p>
    <div className="space-y-2" aria-live="polite">{fresh && source.lots.length ? source.lots.map((lot) => <article key={lot.id} className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-extrabold">{lot.name}</h4><a className="shrink-0 text-xs font-bold underline" href={`https://map.naver.com/p/search/${encodeURIComponent(lot.name + " " + lot.address)}`} target="_blank" rel="noopener noreferrer">지도 보기</a></div>
      <p className="mt-1 text-xs text-muted-foreground">{lot.address}</p>
      <p className="mt-2 text-sm font-bold">조회된 잔여 {lot.remaining.toLocaleString("ko-KR")}대 / 총 {lot.capacity.toLocaleString("ko-KR")}대</p>
    </article>) : <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{query.isFetching ? "추가 주차정보 조회 중…" : source?.status === "missing_key" ? "한국교통안전공단 주차정보 연결이 아직 설정되지 않았습니다." : query.isError ? "주차정보 서버에 연결하지 못했습니다. 다시 조회해 주세요." : source?.status === "ok" && fresh ? "이번 조회 범위에서 검증 가능한 주차정보가 없습니다." : source?.status === "ok" ? "조회한 주차정보가 오래되어 다시 조회해야 합니다." : "한국교통안전공단 제공기관의 응답을 확인할 수 없습니다."}</p>}</div>
    {fresh && <p className="mt-2 text-xs text-muted-foreground">조회 시각 {new Date(source.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국시간) · 원자료 측정 시각 미제공</p>}
    <a className="text-xs underline" href="https://www.data.go.kr/data/15099883/openapi.do" target="_blank" rel="noopener noreferrer">출처: 한국교통안전공단 주차정보 제공 API</a>
  </div>;
}
