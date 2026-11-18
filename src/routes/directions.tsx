import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BusFront, Car, ChevronDown, ExternalLink, MapPinned, Navigation, TrainFront } from "lucide-react";
import { FacilityPicker } from "@/components/app/FacilityPicker";
import { VenueParkingGuide } from "@/components/app/VenueParkingGuide";
import { olympicParkVenueDestinations, transitGuides } from "@/data/transit";
import { useAppStore } from "@/lib/app-store";
import { openNaverMapRoute } from "@/lib/naver-map";

const parkBusStops = [
  { name: "동1문 · 올림픽공원역", routes: "3214 · 3220 · 3319 · 3323 · 3412 · 3413 · 30-5 · 35 · 6300" },
  { name: "남2문 · 한성백제박물관", routes: "3412 · 3413 · 3323 · 30 · 30-5 · 35" },
  { name: "남4문 · 평화의문광장", routes: "3412 · 3413 · 3323 · 30 · 30-5 · 35 · 340" },
];

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
  const selectedDestination = olympicParkVenueDestinations.find(
    (destination) => destination.name === anchor,
  );
  const base = selectedDestination?.name ?? "올림픽홀";
  const [mode, setMode] = useState<"public" | "car">("public");
  const [transitMode, setTransitMode] = useState<"subway" | "bus">("subway");
  const [pickerOpen, setPickerOpen] = useState(false);
  const guide = transitGuides.find((g) => g.anchor === base || g.aliases?.includes(base));
  const subwayItems = guide?.publicTransit.filter((item) => !`${item.title} ${item.detail}`.includes("버스")) ?? [];
  const mapUrl = guide ? createMapUrl(guide.latitude, guide.longitude) : null;

  function openNaverDirections() {
    if (!guide) return;
    openNaverMapRoute({
      latitude: guide.latitude,
      longitude: guide.longitude,
      name: `올림픽공원 ${base}`,
    }, mode);
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
        <h1 className="min-w-0 truncate text-2xl font-black sm:text-3xl">{base} 가는 길</h1>
        <ChevronDown className="h-6 w-6 shrink-0" />
      </button>
      {guide && mapUrl && (
        <section
          className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          aria-label={`${base} 지도`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime text-lime-foreground">
                <MapPinned className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold">{base}</p>
                <p className="truncate text-xs text-muted-foreground">{guide.address}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openNaverDirections}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Navigation className="h-3.5 w-3.5" /> 길찾기
            </button>
          </div>
          <iframe
            src={mapUrl}
            title={`${base} 위치 지도`}
            loading="lazy"
            className="h-64 w-full border-0 sm:h-80"
          />
        </section>
      )}
      <div className="mb-4 grid grid-cols-2 rounded-full bg-secondary p-1">
        {(["public", "car"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
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
              {transitMode === "subway" ? <div><h3 className="mb-2 text-sm font-extrabold">{base} 지하철 안내</h3><ul className="space-y-2">{subwayItems.map((item) => <li key={item.title} className="rounded-xl bg-secondary p-4"><p className="font-extrabold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p></li>)}</ul><p className="mt-3 text-xs leading-5 text-muted-foreground">출구에서 공연장까지의 이동 경로는 지도에서 확인해 주세요.</p></div> : <div><h3 className="text-sm font-extrabold">올림픽공원 입구별 버스 안내</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">공원 공통 안내입니다. {base}에 가까운 정류장과 하차 후 경로를 지도에서 확인해 주세요.</p><ul className="mt-3 space-y-2">{parkBusStops.map((stop) => <li key={stop.name} className="rounded-xl bg-secondary p-4"><p className="font-extrabold">{stop.name}</p><p className="mt-2 text-sm font-bold">{stop.routes}</p></li>)}</ul><button type="button" onClick={openNaverDirections} className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">{base} 대중교통 길찾기</button><a href="https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20109000000" target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center gap-1 text-xs font-bold underline">전체 정류장과 노선 확인 <ExternalLink className="h-3 w-3" /></a></div>}
            </div>
          </section>}
          {mode === "car" && (
            <VenueParkingGuide venue={base} />
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
          setMode("public");
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
function createMapUrl(latitude: number, longitude: number) {
  const horizontalRange = 0.009;
  const verticalRange = 0.006;
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
