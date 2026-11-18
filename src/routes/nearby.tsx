import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bath,
  Coffee,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Navigation,
  RotateCcw,
  Store,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getInternalFacilities,
  internalFacilityCategories,
  OFFICIAL_PARK_MAP_PDF_URL,
  type InternalFacilityCategory,
} from "@/data/internal-facilities";
import { openNaverMapRoute } from "@/lib/naver-map";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "내부 시설 — The:Check" },
      {
        name: "description",
        content: "올림픽공원 내부 카페·편의점·화장실·편의시설 위치를 지도 핀으로 확인하세요.",
      },
      { property: "og:title", content: "올림픽공원 내부 시설 — The:Check" },
      {
        property: "og:description",
        content: "공원 내부 편의시설을 카테고리별 지도 핀으로 확인하세요.",
      },
    ],
  }),
  component: InternalFacilities,
});

const categoryIcons = {
  카페: Coffee,
  편의점: Store,
  화장실: Bath,
  기타: Info,
} satisfies Record<InternalFacilityCategory, typeof Coffee>;

const OFFICIAL_MAP_WIDTH = 953.04535;
const OFFICIAL_MAP_HEIGHT = 676.87866;

function InternalFacilities() {
  const [category, setCategory] = useState<InternalFacilityCategory>("카페");
  const facilities = getInternalFacilities(category);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const selectedFacility = facilities.find((facility) => facility.id === selectedFacilityId);
  const [mapZoom, setMapZoom] = useState(1);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedFacility) return;

    const frame = requestAnimationFrame(() => {
      const viewport = mapViewportRef.current;
      const content = mapContentRef.current;
      if (!viewport || !content) return;

      const left = (selectedFacility.mapX / OFFICIAL_MAP_WIDTH) * content.scrollWidth;
      const top = (selectedFacility.mapY / OFFICIAL_MAP_HEIGHT) * content.scrollHeight;
      viewport.scrollTo({
        left: Math.max(0, left - viewport.clientWidth / 2),
        top: Math.max(0, top - viewport.clientHeight / 2),
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [mapZoom, selectedFacility]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-extrabold text-brand-orange">올림픽공원 안내</p>
        <h1 className="mt-1 text-3xl font-black text-primary sm:text-4xl">내부 시설</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          아래 편의시설을 누르면 지도에 해당 위치가 핀으로 표시돼요.
        </p>
      </header>

      <section
        className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-card"
        aria-labelledby="venue-map-title"
      >
        <div className="p-4 sm:p-5">
          <h2
            id="venue-map-title"
            className="flex items-start gap-2 text-xl font-black text-primary"
          >
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
            <span>올림픽공원 내부 편의시설</span>
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            지도를 직접 확대하거나 이동할 수 있어요. 아래에서 시설을 선택하면 위치가 표시됩니다.
          </p>
        </div>

        <div className="border-y border-border bg-secondary">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 px-3 py-2">
            <p className="text-[0.7rem] font-semibold text-muted-foreground">
              시설 선택 후 핀 확인 · 버튼으로 확대
            </p>
            <div className="flex shrink-0 items-center gap-1" aria-label="안내도 확대 및 축소">
              <button
                type="button"
                onClick={() => setMapZoom((zoom) => Math.max(1, zoom - 0.5))}
                disabled={mapZoom <= 1}
                aria-label="안내도 축소"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-primary disabled:opacity-35"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom(1)}
                aria-label="안내도 크기 초기화"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-primary"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((zoom) => Math.min(3, zoom + 0.5))}
                disabled={mapZoom >= 3}
                aria-label="안내도 확대"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-primary disabled:opacity-35"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={mapViewportRef}
            className="relative h-64 touch-pan-x touch-pan-y overflow-auto overscroll-contain bg-[#ececec] sm:h-80"
            aria-label="올림픽공원 공식 안내도"
          >
            <div
              ref={mapContentRef}
              className="relative origin-top-left"
              style={{
                width: `${mapZoom * 100}%`,
                aspectRatio: `${OFFICIAL_MAP_WIDTH} / ${OFFICIAL_MAP_HEIGHT}`,
              }}
            >
              <img
                src="/olympic-park-guide.png"
                alt="올림픽공원 공식 종합안내도"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none"
              />

              {selectedFacility && (
                <div
                  role="img"
                  aria-label={`${selectedFacility.name} 위치 핀`}
                  className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
                  style={{
                    left: `${(selectedFacility.mapX / OFFICIAL_MAP_WIDTH) * 100}%`,
                    top: `${(selectedFacility.mapY / OFFICIAL_MAP_HEIGHT) * 100}%`,
                  }}
                >
                  <span className="mb-1 max-w-40 truncate whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-extrabold text-primary-foreground shadow-lg">
                    {selectedFacility.name}
                  </span>
                  <MapPin
                    className="h-9 w-9 fill-brand-orange text-white drop-shadow-lg"
                    strokeWidth={2.5}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedFacility && (
          <div className="border-b border-border bg-secondary/50 px-4 py-3 sm:px-5">
            <p className="font-extrabold text-primary">{selectedFacility.name}</p>
            <p className="mt-1 text-xs font-semibold leading-5">{selectedFacility.location}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {selectedFacility.detail}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 p-4 sm:p-5">
          <button
            type="button"
            disabled={!selectedFacility}
            onClick={() => {
              if (!selectedFacility) return;
              openNaverMapRoute(
                {
                  latitude: selectedFacility.latitude,
                  longitude: selectedFacility.longitude,
                  name: `올림픽공원 ${selectedFacility.name}`,
                },
                "car",
              );
            }}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-3 text-sm font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Navigation className="h-4 w-4" />
            {selectedFacility ? "선택 시설 길찾기" : "시설을 선택해 주세요"}
          </button>
          <a
            href={OFFICIAL_PARK_MAP_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-primary px-3 py-3 text-center text-sm font-extrabold text-primary"
          >
            <FileText className="h-4 w-4" /> 공식 안내도 보기
          </a>
        </div>
      </section>

      <section aria-labelledby="facility-list-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground">공원 안에서 찾기</p>
            <h2 id="facility-list-title" className="text-2xl font-black text-primary">
              편의시설
            </h2>
          </div>
          <a
            href="https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20106020000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary underline underline-offset-4"
          >
            운영 정보 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-4 gap-2" aria-label="내부 시설 카테고리">
          {internalFacilityCategories.map((item) => {
            const Icon = categoryIcons[item];
            const selected = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  setSelectedFacilityId(null);
                  setMapZoom(1);
                }}
                aria-pressed={selected}
                className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-xs font-extrabold transition sm:flex-row sm:justify-center sm:text-sm ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary"}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item}</span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {facilities.map((facility) => {
            return (
              <li
                key={facility.id}
                className={`rounded-2xl border bg-card shadow-card ${facility.id === selectedFacility?.id ? "border-brand-orange ring-2 ring-brand-orange/20" : "border-border"}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFacilityId(facility.id);
                    setMapZoom((zoom) => Math.max(zoom, 1.5));
                  }}
                  className="w-full p-4 text-left"
                  aria-label={`${facility.name} 지도 핀 선택`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-primary">{facility.name}</h3>
                      <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold leading-5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange" />
                        <span>{facility.location}</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{facility.detail}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
