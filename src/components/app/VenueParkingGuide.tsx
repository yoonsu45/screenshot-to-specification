import { useQuery } from "@tanstack/react-query";
import { Car, ExternalLink, RefreshCw } from "lucide-react";
import { getParkingOverview } from "@/lib/parking-api";
import { getParkingMapDestination, getVenueParking, PARKING_GUIDE_URL, type ParkingSource } from "@/lib/parking-data";
import { openNaverMapPlace } from "@/lib/naver-map";
import { SeoulParkingGuide } from "./SeoulParkingGuide";

const sources = {
  live: "https://www.ksponco.or.kr/pubData/64?mid=a10106020000",
  flow: "https://www.culture.go.kr/data/openapi/openapiView.do?id=659",
  context: "https://www.culture.go.kr/data/openapi/openapiView.do?id=675",
};

export function VenueParkingGuide({ venue }: { venue: string }) {
  const parking = getVenueParking(venue);
  const query = useQuery({
    queryKey: ["parking-overview"],
    queryFn: () => getParkingOverview(),
    staleTime: 60000,
    refetchInterval: 60000,
    retry: false,
    enabled: !!parking,
  });
  if (!parking) return null;
  const live = query.data?.live;
  const fresh = live?.status === "ok" && Date.now() - Date.parse(live.fetchedAt) < 120000;
  const reading = fresh ? live.readings[0] : undefined;

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card" aria-label={`${venue} 주차 안내`}>
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-extrabold"><Car className="h-5 w-5" /> {venue} 주차 안내</h2>
        <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="flex shrink-0 items-center gap-1 text-xs font-bold disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} /> 새로고침
        </button>
      </div>
      <div className="space-y-4 p-4">
        <div className="rounded-xl bg-secondary p-4" aria-live="polite">
          <p className="text-sm font-bold">공원 주차현황 · 동2/남2/북2문 제공 범위</p>
          <p className="mt-1 text-2xl font-black">{reading ? `${reading.count.toLocaleString("ko-KR")}대` : query.isFetching ? "조회 중…" : "현재 현황 확인 불가"}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">API 제공 주차대수입니다. 개별 주차장의 잔여 대수가 아닙니다. 원자료 측정 시각은 제공되지 않습니다.</p>
          {reading && <p className="text-xs text-muted-foreground">조회 시각 {new Date(live!.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국시간)</p>}
          <a className="text-xs underline" href={sources.live} target="_blank" rel="noopener noreferrer">실시간 데이터 출처</a>
        </div>

        <ParkingCard name={parking.primary} label="가까운 주차장 · 공식 안내 기준" />
        <div>
          <h3 className="mb-2 text-sm font-extrabold">혼잡할 때 확인할 대체 주차장</h3>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">이용 가능한 자리가 확인된 곳은 아닙니다. 입구 통제·운영 여부와 도보 경로를 확인해 주세요.</p>
          <div className="space-y-2">{parking.alternatives.map((name) => <ParkingCard key={name} name={name} label="대체 후보" />)}</div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">공원 내부 주차장별 실시간 대수와 동일 범위의 총 주차면 수가 제공되지 않아 내부 주차장의 혼잡도와 예상 주차 가능 대수를 산출할 수 없습니다.</p>
        <a href={PARKING_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold underline">공식 주차장·요금·운영 안내 <ExternalLink className="h-3 w-3" /></a>

        <SeoulParkingGuide />
        <details className="border-t border-border pt-3">
          <summary className="cursor-pointer text-sm font-bold">과거 입출차 자료 확인</summary>
          <p className="mt-2 text-xs text-muted-foreground">조회된 일부 기록입니다. 최신 기록이나 현재 혼잡도·도착 시점 예측이 아닙니다.</p>
          <History label="입출차정보 (659)" source={query.data?.flow} url={sources.flow} loading={query.isFetching} />
          <History label="입출차 추가정보 (675)" source={query.data?.context} url={sources.context} loading={query.isFetching} />
        </details>
      </div>
    </section>
  );
}

function ParkingCard({ name, label }: { name: string; label: string }) {
  const destination = getParkingMapDestination(name);
  return <article className="rounded-xl border border-border p-3">
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    <div className="mt-1 flex items-center justify-between gap-3">
      <h3 className="font-extrabold">{name}</h3>
      <button
        type="button"
        onClick={() => destination && openNaverMapPlace(destination)}
        disabled={!destination}
        className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`${name} 네이버지도 앱에서 찾기`}
      >
        지도 보기
      </button>
    </div>
    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
      <div><dt className="text-muted-foreground">현재 혼잡도</dt><dd className="mt-1 font-bold">확인 불가</dd></div>
      <div><dt className="text-muted-foreground">예상 주차 가능 차량</dt><dd className="mt-1 font-bold">확인 불가</dd></div>
    </dl>
  </article>;
}

function History({ label, source, url, loading }: { label: string; source: ParkingSource | undefined; url: string; loading: boolean }) {
  return <div className="mt-3 rounded-xl bg-secondary/60 p-3">
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline">{label}</a>
    {source?.status === "ok" && source.readings.length > 0 ? <ul className="mt-2 space-y-1 text-xs">{source.readings.map((row, index) => <li key={`${row.at}-${index}`} className="flex flex-wrap justify-between gap-2"><span>{row.at} (한국시간)</span><span>주차대수 {row.count.toLocaleString("ko-KR")}대</span></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">{source?.status === "missing_key" ? "서비스 연결 준비 중" : loading ? "조회 중…" : source?.status === "ok" ? "주차대수로 확인할 수 있는 기록이 없습니다." : "제공기관 응답 지연 또는 오류로 자료를 확인할 수 없습니다."}</p>}
  </div>;
}
