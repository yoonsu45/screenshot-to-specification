import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bath,
  Coffee,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";
import {
  getInternalFacilities,
  getInternalVenueProfile,
  internalFacilityMapBounds,
  internalFacilityCategories,
  OFFICIAL_PARK_MAP_PDF_URL,
  type InternalFacility,
  type InternalFacilityCategory,
} from "@/data/internal-facilities";
import { useAppStore } from "@/lib/app-store";
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

function InternalFacilities() {
  const { anchor } = useAppStore();
  const venue = getInternalVenueProfile(anchor);
  const [category, setCategory] = useState<InternalFacilityCategory>("카페");
  const facilities = getInternalFacilities(category, venue.name);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const selectedFacility = facilities.find((facility) => facility.id === selectedFacilityId);
  const mapUrl = createMapUrl(selectedFacility);

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
            지도를 직접 확대하거나 이동할 수 있어요. {venue.name}과 가까운 시설은 목록 위에
            표시됩니다.
          </p>
        </div>

        <div className="relative h-64 overflow-hidden border-y border-border bg-secondary sm:h-80">
          <iframe
            key={selectedFacility?.id ?? "olympic-park"}
            src={mapUrl}
            title={selectedFacility ? `${selectedFacility.name} 위치 지도` : "올림픽공원 내부 지도"}
            loading="lazy"
            className="h-full w-full border-0"
          />
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
            const nearby = facility.near.includes(venue.name);
            return (
              <li
                key={facility.id}
                className={`rounded-2xl border bg-card shadow-card ${facility.id === selectedFacility?.id ? "border-brand-orange ring-2 ring-brand-orange/20" : "border-border"}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFacilityId(facility.id)}
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
                    {nearby && (
                      <span className="shrink-0 rounded-full bg-lime/70 px-2 py-1 text-[10px] font-extrabold text-primary">
                        공연장 인근
                      </span>
                    )}
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

function createMapUrl(facility?: InternalFacility) {
  const { north, south, east, west } = internalFacilityMapBounds;
  const bbox = facility
    ? [
        facility.longitude - 0.0035,
        facility.latitude - 0.0025,
        facility.longitude + 0.0035,
        facility.latitude + 0.0025,
      ]
    : [west, south, east, north];
  const params = new URLSearchParams({
    bbox: bbox.join(","),
    layer: "mapnik",
  });
  if (facility) params.set("marker", `${facility.latitude},${facility.longitude}`);
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
