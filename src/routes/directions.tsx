import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BusFront, Car, ChevronDown, ExternalLink, MapPinned, Navigation, TrainFront } from "lucide-react";
import { FacilityPicker } from "@/components/app/FacilityPicker";
import { VenueParkingGuide } from "@/components/app/VenueParkingGuide";
import { KakaoLocationMap } from "@/components/app/KakaoLocationMap";
import { olympicParkVenueDestinations, transitGuides } from "@/data/transit";
import { internalVenueProfiles } from "@/data/internal-facilities";
import busStops from "@/data/seoul-bus-stops.json";
import { useAppStore } from "@/lib/app-store";
import type { ParkingMapDestination } from "@/lib/parking-data";
import { getKakaoRoute, type RouteResult } from "@/lib/kakao-route";
import { findTransitDestination } from "@/lib/transit-destination";

const subwayStations = [
  { name: "올림픽공원역", latitude: 37.5160647, longitude: 127.1304996 },
  { name: "몽촌토성역", latitude: 37.5175, longitude: 127.11278 },
];

function straightLineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = Math.PI / 180;
  const dLat = (lat2 - lat1) * radians;
  const dLon = (lon2 - lon1) * radians;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * radians) * Math.cos(lat2 * radians) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export {
  createNaverMapAndroidIntentUrl,
  createNaverMapAppUrl,
  createNaverMapPlaceUrl,
  createNaverMapWebUrl,
  isIOSDevice,
} from "@/lib/naver-map";

export const Route = createFileRoute("/directions")({
  head: () => ({
    meta: [
      { title: "The:Check" },
      {
        name: "description",
        content: "공연장까지 대중교통과 자가용으로 가는 방법, 가까운 주차장을 확인하세요.",
      },
      { property: "og:title", content: "가는 길·주차 — 올팍 행사체크" },
      {
        property: "og:description",
        content: "대중교통과 자가용 경로, 가까운 주차장을 확인하세요.",
      },
    ],
  }),
  component: Directions,
});

function Directions() {
  const { anchor, setAnchor, setFacilityId } = useAppStore();
  const selectedDestination = findTransitDestination(anchor);
  const base = selectedDestination?.name ?? "올림픽홀";
  const destinationLabel = base === "수변무대" ? "88호수 수변무대" : base;
  const [mode, setMode] = useState<"public" | "car">("public");
  const [transitMode, setTransitMode] = useState<"subway" | "bus">("subway");
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParkingMapDestination | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const mapRef = useRef<HTMLElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const guide = transitGuides.find((g) => g.anchor === base || g.aliases?.includes(base));
  const subwayItems = guide?.publicTransit.filter((item) => !`${item.title} ${item.detail}`.includes("버스")) ?? [];
  const venueProfile = internalVenueProfiles.find((profile) => [profile.name, ...profile.aliases].includes(base));
  const nearbyBusStops = venueProfile ? busStops.map((stop) => ({ ...stop, distance: straightLineMeters(venueProfile.latitude, venueProfile.longitude, stop.latitude, stop.longitude) })).sort((a, b) => a.distance - b.distance).slice(0, 4) : [];
  const selectedStop = nearbyBusStops.find((stop) => stop.id === selectedStopId);
  const mapLocation = selectedParking ?? selectedStation ?? selectedStop;
  const mapUrl = guide ? createMapUrl(mapLocation?.latitude ?? venueProfile?.latitude ?? guide.latitude, mapLocation?.longitude ?? venueProfile?.longitude ?? guide.longitude) : null;
  const routeGeneration = useRef(0);

  useEffect(() => {
    routeGeneration.current += 1;
    setRoute(null);
    setRouteError(null);
    setRouteLoading(false);
  }, [base, mode, mapLocation?.latitude, mapLocation?.longitude]);

  function findRoute() {
    if (!guide || !navigator.geolocation) { setRouteError("현재 위치를 사용할 수 없습니다."); return; }
    const generation = ++routeGeneration.current;
    setRouteError(null);
    setRoute(null);
    setRouteLoading(true);
    const destination = mapLocation ?? venueProfile ?? guide;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        if (generation !== routeGeneration.current) return;
        const result = await getKakaoRoute({ data: { origin: { latitude: coords.latitude, longitude: coords.longitude }, destination: { latitude: destination.latitude, longitude: destination.longitude }, mode } });
        if (generation === routeGeneration.current) setRoute(result);
      } catch { if (generation === routeGeneration.current) setRouteError("길찾기를 불러오지 못했습니다. 다시 시도해 주세요."); }
      finally { if (generation === routeGeneration.current) setRouteLoading(false); }
    }, () => { if (generation === routeGeneration.current) { setRouteLoading(false); setRouteError("현재 위치를 확인하지 못했습니다. 기기의 위치 권한을 확인해 주세요."); } }, { timeout: 10000, maximumAge: 30000 });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-muted-foreground">도착지</p>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mb-4 mt-1 flex max-w-full items-center gap-1.5 rounded-2xl bg-lime/60 px-3 py-2 text-left text-primary"
        aria-label="도착지 변경"
      >
        <h1 className="min-w-0 truncate text-2xl font-black sm:text-3xl">{destinationLabel} 가는 길</h1>
        <ChevronDown className="h-6 w-6 shrink-0" />
      </button>
      {guide && mapUrl && (
        <section
          ref={mapRef}
          className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          aria-label={`${base} 지도`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime text-lime-foreground">
                <MapPinned className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold">{mapLocation?.name ?? destinationLabel}</p>
                <p className="truncate text-xs text-muted-foreground">{selectedParking ? "주차장 위치" : selectedStation ? "지하철역 위치 · 출구 위치와 다를 수 있음" : selectedStop ? `버스 정류소 ${selectedStop.number}` : guide.address}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={findRoute}
              disabled={routeLoading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Navigation className="h-3.5 w-3.5" /> {routeLoading ? "조회 중…" : "현재 위치에서 길찾기"}
            </button>
          </div>
          <div className="bg-secondary p-2 sm:p-3">
            <KakaoLocationMap latitude={mapLocation?.latitude ?? venueProfile?.latitude ?? guide.latitude} longitude={mapLocation?.longitude ?? venueProfile?.longitude ?? guide.longitude} name={mapLocation?.name ?? base} fallbackUrl={mapUrl} routePoints={route?.status === "ok" ? route.points : undefined} />
          </div>
          {(routeError || route) && <div className="space-y-2 border-t border-border p-4 text-sm" aria-live="polite">{routeError ? <p>{routeError}</p> : route?.status === "ok" ? <><p className="font-bold">약 {Math.ceil(route.duration / 60)}분 · {(route.distance / 1000).toFixed(1)}km</p>{route.steps.length > 0 && <ol className="list-inside list-decimal space-y-1 text-xs">{route.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}{route.points.length < 2 && <p className="text-xs">경로 선을 표시할 수 없습니다.</p>}</> : <p>{route?.status === "missing_key" ? "길찾기 연결을 준비 중입니다." : route?.status === "no_route" ? "이 경로를 찾지 못했습니다." : "길찾기 정보를 불러오지 못했습니다."}</p>}</div>}
          {mapLocation && <button type="button" onClick={() => { setSelectedStopId(null); setSelectedStation(null); setSelectedParking(null); }} className="w-full border-t border-border py-2 text-xs font-bold text-primary">공연장 위치로 돌아가기</button>}
        </section>
      )}
      <div className="mb-4 grid grid-cols-2 rounded-full bg-secondary p-1">
        {(["public", "car"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelectedParking(null); setSelectedStation(null); setSelectedStopId(null); setRoute(null); setRouteError(null); }}
            className={`rounded-full py-2.5 text-sm font-bold ${mode === m ? "bg-primary text-primary-foreground" : "text-secondary-foreground"}`}
          >
            {m === "public" ? "대중교통 이용" : "승용차 이용"}
          </button>
        ))}
      </div>
      {!guide ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          이 장소의 교통 안내는 아직 연결 전이에요.
        </p>
      ) : (
        <>
          {mode === "public" && <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card" aria-label="대중교통 안내">
            <div className="border-b border-border p-4"><h2 className="font-extrabold">대중교통 안내</h2><p className="mt-1 text-xs text-muted-foreground">이용할 교통수단을 선택해 안내를 확인하세요.</p></div>
            <div className="p-4">
              <div className="mb-4 grid grid-cols-2 gap-2" role="group" aria-label="대중교통 수단 선택">
                {(["subway", "bus"] as const).map((option) => {
                  const Icon = option === "subway" ? TrainFront : BusFront;
                  return <button key={option} type="button" aria-pressed={transitMode === option} onClick={() => setTransitMode(option)} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold ${transitMode === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-foreground"}`}><Icon className="h-5 w-5" />{option === "subway" ? "지하철" : "버스"}</button>;
                })}
              </div>
              {transitMode === "subway" ? <div><h3 className="mb-2 text-sm font-extrabold">{base} 지하철 안내</h3><ul className="space-y-2">{subwayItems.map((item) => <li key={item.title} className="rounded-xl bg-secondary p-4">{(() => { const station = subwayStations.find((entry) => item.title.includes(entry.name)); return station ? <button type="button" className="text-left font-extrabold underline underline-offset-2" onClick={() => { setRoute(null); setSelectedParking(null); setSelectedStopId(null); setSelectedStation(station); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{item.title}</button> : <p className="font-extrabold">{item.title}</p>; })()}<p className="mt-1 text-sm text-muted-foreground">{item.detail}</p></li>)}</ul><p className="mt-3 text-xs leading-5 text-muted-foreground">출구에서 공연장까지의 이동 경로는 지도에서 확인해 주세요.</p></div> : <div><h3 className="text-sm font-extrabold">{base} 주변 버스 정류장</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">정류장은 공연장 좌표와의 직선거리 순입니다. 실제 도보 거리와 출입 가능 경로는 다를 수 있으니 지도에서 확인해 주세요.</p>{nearbyBusStops.length ? <ul className="mt-3 space-y-2">{nearbyBusStops.map((stop) => <li key={stop.id} className="rounded-xl bg-secondary p-4"><div className="flex items-start justify-between gap-2"><div><button type="button" onClick={() => { setRoute(null); setSelectedParking(null); setSelectedStation(null); setSelectedStopId(stop.id); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="text-left font-extrabold underline underline-offset-2">{stop.name}</button><p className="mt-1 text-xs text-muted-foreground">정류소 번호 {stop.number} · 직선 약 {Math.round(stop.distance / 10) * 10}m</p></div><button type="button" onClick={() => { setRoute(null); setSelectedParking(null); setSelectedStation(null); setSelectedStopId(stop.id); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">지도 보기</button></div><p className="mt-2 text-sm font-bold">{stop.routes.join(" · ")}</p></li>)}</ul> : <p className="mt-3 rounded-xl bg-secondary p-4 text-sm">이 장소의 정류장 위치 정보는 아직 확인할 수 없습니다.</p>}<p className="mt-3 text-xs leading-5 text-muted-foreground">서울시 버스 자료 2026.09.02 기준 · 서울시 제공 범위의 노선이며 실시간 정보가 아닙니다. 같은 이름의 정류장은 방향이 다를 수 있습니다.</p><button type="button" onClick={findRoute} disabled={routeLoading} className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">{base} 대중교통 길찾기</button><a href="https://data.seoul.go.kr/dataList/OA-1095/A/1/datasetView.do" target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center gap-1 text-xs font-bold underline">노선 자료 출처 <ExternalLink className="h-3 w-3" /></a></div>}
            </div>
          </section>}
          {mode === "car" && (
            <VenueParkingGuide venue={base} onShowParking={(parking) => { setRoute(null); setRouteError(null); setSelectedStopId(null); setSelectedStation(null); setSelectedParking(parking); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
          )}
          <a
            href="https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20109000000"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab"
          >
            <ExternalLink className="h-4 w-4" /> 공식 교통·주차 안내
          </a>
        </>
      )}
      <FacilityPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={selectedDestination?.id ?? "olympic-hall"}
        items={olympicParkVenueDestinations}
        searchPlaceholder="공연장 이름 검색"
        title="도착 공연장 선택"
        description="올림픽공원 안의 공연장을 고르세요"
        onSelect={(id) => {
          const destination = olympicParkVenueDestinations.find((item) => item.id === id);
          if (!destination) return;
          setFacilityId("olympic-park");
          setAnchor(destination.name);
          setSelectedStopId(null);
          setSelectedStation(null);
          setSelectedParking(null);
          setRoute(null);
          setRouteError(null);
          setMode("public");
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
function createMapUrl(latitude: number, longitude: number) {
  const horizontalRange = 0.0045;
  const verticalRange = 0.003;
  const bbox = [
    longitude - horizontalRange,
    latitude - verticalRange,
    longitude + horizontalRange,
    latitude + verticalRange,
  ].join(",");

  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
