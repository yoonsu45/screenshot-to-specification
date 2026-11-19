import { useQuery } from "@tanstack/react-query";
import { ChevronDown, RefreshCw } from "lucide-react";
import { getTsParking } from "@/lib/parking-api";
import type { ParkingMapDestination } from "@/lib/parking-data";

export function TsParkingGuide({ onShowParking }: { onShowParking: (destination: ParkingMapDestination) => void }) {
  return <details className="group rounded-xl border border-border bg-secondary">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
      <span><span className="block font-extrabold">주변 주차장 실시간 조회</span><span className="mt-1 block text-xs text-muted-foreground">한국교통안전공단 연계</span></span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><span className="group-open:hidden">펼치기</span><span className="hidden group-open:inline">접기</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></span>
    </summary>
    <TsParkingDetails onShowParking={onShowParking} />
  </details>;
}

function TsParkingDetails({ onShowParking }: { onShowParking: (destination: ParkingMapDestination) => void }) {
  const query = useQuery({ queryKey: ["ts-parking"], queryFn: () => getTsParking(), staleTime: 60000, refetchInterval: 60000, retry: false });
  const source = query.data;
  const fresh = source?.status === "ok" && Date.now() - Date.parse(source.fetchedAt) < 120000;
  return <div className="border-t border-border p-4">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold">추가 주차정보 · 한국교통안전공단</h3><button type="button" className="flex shrink-0 items-center gap-1 text-xs font-bold disabled:opacity-50" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} /> 새로고침</button></div>
    <div className="mt-3 space-y-2" aria-live="polite">{fresh && source.lots.length ? source.lots.map((lot) => <article key={lot.id} className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-extrabold">{lot.name}</h4><button type="button" onClick={() => onShowParking(lot)} className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground" aria-label={`${lot.name} 지도에서 보기`}>지도 보기</button></div>
      <p className="mt-1 text-xs text-muted-foreground">{lot.address}</p>
      <p className="mt-2 text-sm font-bold">조회된 잔여 {lot.remaining.toLocaleString("ko-KR")}대 / 총 {lot.capacity.toLocaleString("ko-KR")}대</p>
    </article>) : <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{query.isFetching ? "추가 주차정보 조회 중…" : source?.status === "missing_key" ? "한국교통안전공단 주차정보 연결이 아직 설정되지 않았습니다." : query.isError ? "주차정보 서버에 연결하지 못했습니다. 다시 조회해 주세요." : source?.status === "ok" && fresh ? "이번 조회 범위에서 검증 가능한 주차정보가 없습니다." : source?.status === "ok" ? "조회한 주차정보가 오래되어 다시 조회해야 합니다." : "한국교통안전공단 제공기관의 응답을 확인할 수 없습니다."}</p>}</div>
    {fresh && <p className="mt-2 text-xs text-muted-foreground">조회 시각 {new Date(source.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국시간) · 원자료 측정 시각 미제공</p>}
    <a className="text-xs underline" href="https://www.data.go.kr/data/15099883/openapi.do" target="_blank" rel="noopener noreferrer">출처: 한국교통안전공단 주차정보 제공 API</a>
  </div>;
}
