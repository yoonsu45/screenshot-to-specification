import { useQuery } from "@tanstack/react-query";
import { Car, ExternalLink, RefreshCw } from "lucide-react";
import { getParkingOverview } from "@/lib/parking-api";
import {
  getParkingMapDestination,
  getParkAvailability,
  getVenueParking,
  PARK_AGGREGATE_CAPACITY,
  PARKING_GUIDE_URL,
} from "@/lib/parking-data";
import { openNaverMapPlace } from "@/lib/naver-map";
import { SeoulParkingGuide } from "./SeoulParkingGuide";
import { TsParkingGuide } from "./TsParkingGuide";

const sources = {
  live: "https://www.ksponco.or.kr/pubData/64?mid=a10106020000",
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
  const availability = reading ? getParkAvailability(reading.count) : null;

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
          <p className="mt-1 text-2xl font-black">{availability ? `잔여 약 ${availability.remaining.toLocaleString("ko-KR")}대` : query.isFetching && !reading ? "조회 중…" : "잔여 대수 확인 불가"}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><dt className="text-muted-foreground">총 수용 대수</dt><dd className="mt-1 font-bold">{PARK_AGGREGATE_CAPACITY.toLocaleString("ko-KR")}대</dd></div>
            <div><dt className="text-muted-foreground">현재 주차 차량</dt><dd className="mt-1 font-bold">{reading ? `${reading.count.toLocaleString("ko-KR")}대` : "확인 불가"}</dd></div>
            <div><dt className="text-muted-foreground">혼잡도 · 서비스 산정</dt><dd className="mt-1 font-bold">{availability?.label ?? "확인 불가"}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">잔여 대수는 총 2,200대에서 현재 주차 차량 수를 뺀 계산값입니다. 이 제공 범위의 합계이며 P2·P5 등 개별 주차장의 빈자리가 아닙니다. 도착 시점의 주차를 보장하지 않습니다.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">점유율 70% 미만 여유 · 70~90% 미만 보통 · 90% 이상 혼잡 · 잔여 0대 만차. 원자료 측정 시각은 제공되지 않습니다.</p>
          {reading && !availability && <p className="mt-2 text-xs font-bold text-brand-orange">현재 차량 수가 수용 대수 범위를 벗어나 잔여 대수를 계산할 수 없습니다.</p>}
          {reading && <p className="text-xs text-muted-foreground">조회 시각 {new Date(live!.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (한국시간)</p>}
          <a className="text-xs underline" href={sources.live} target="_blank" rel="noopener noreferrer">실시간 데이터 출처</a>
        </div>

        <ParkingCard name={parking.primary} label="가까운 주차장 · 공식 안내 기준" />
        <p className="text-xs leading-5 text-muted-foreground">공원 내부 주차장별 실시간 대수와 동일 범위의 총 주차면 수가 제공되지 않아 내부 주차장의 혼잡도와 예상 주차 가능 대수를 산출할 수 없습니다.</p>
        <a href={PARKING_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold underline">공식 주차장·요금·운영 안내 <ExternalLink className="h-3 w-3" /></a>

        <SeoulParkingGuide />
        <TsParkingGuide />
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
