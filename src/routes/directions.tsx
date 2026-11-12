import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Car, ExternalLink, MapPinned, Navigation, TrainFront } from "lucide-react";
import { transitGuides } from "@/data/transit";
import { useAppStore } from "@/lib/app-store";
import { resolveAnchor } from "@/lib/anchor";

export const Route = createFileRoute("/directions")({
  head: () => ({
    meta: [
      { title: "가는 길·주차 — 올팍 행사체크" },
      { name: "description", content: "공연장까지 대중교통과 자가용으로 가는 방법, 가까운 주차장을 확인하세요." },
      { property: "og:title", content: "가는 길·주차 — 올팍 행사체크" },
      { property: "og:description", content: "대중교통과 자가용 경로, 가까운 주차장을 확인하세요." },
    ],
  }),
  component: Directions,
});

function Directions() {
  const { anchor, facilityId } = useAppStore();
  const base = resolveAnchor(anchor, facilityId);
  const [mode, setMode] = useState<"public" | "car">("public");
  const guide = transitGuides.find((g) => g.anchor === base || g.aliases?.includes(base));
  const items = guide ? (mode === "public" ? guide.publicTransit : guide.car) : [];
  const Icon = mode === "public" ? TrainFront : Car;
  const mapUrl = guide ? createMapUrl(guide.latitude, guide.longitude) : null;
  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(base)}`;

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-muted-foreground">도착지</p>
      <h1 className="mb-4 mt-1 text-2xl font-black text-primary sm:text-3xl">{base} 가는 길</h1>
      {guide && mapUrl && (
        <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-card" aria-label={`${base} 지도`}>
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
            <a href={naverMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
              <Navigation className="h-3.5 w-3.5" /> 길찾기
            </a>
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
          <button key={m} onClick={() => setMode(m)} className={`rounded-full py-2.5 text-sm font-bold ${mode === m ? "bg-primary text-primary-foreground" : "text-secondary-foreground"}`}>
            {m === "public" ? "대중교통" : "자가용"}
          </button>
        ))}
      </div>
      {!guide ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">이 장소의 교통 안내는 아직 연결 전이에요.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.title} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-6 w-6" /></span>
                <div className="min-w-0">
                  <p className="font-extrabold">{i.title}</p>
                  <p className="text-sm text-muted-foreground">{i.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          {mode === "car" && <p className="mt-3 text-xs text-muted-foreground">실시간 잔여 주차면은 아직 연결 전이에요.</p>}
          <a href={guide.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab">
            <ExternalLink className="h-4 w-4" /> 공식 교통·주차 안내
          </a>
        </>
      )}
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
