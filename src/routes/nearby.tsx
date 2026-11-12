import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { nearbyPlaces, placeCategories } from "@/data/places";
import { useAppStore } from "@/lib/app-store";
import { resolveAnchor } from "@/lib/anchor";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "공연장 주변 — 올팍 행사체크" },
      { name: "description", content: "공연장 주변의 산책·사진, 카페·식사, 전시·문화 장소를 둘러보세요." },
      { property: "og:title", content: "공연장 주변 — 올팍 행사체크" },
      { property: "og:description", content: "공연장 주변의 산책, 카페, 전시 장소를 둘러보세요." },
    ],
  }),
  component: Nearby,
});

function Nearby() {
  const { anchor, facilityId, setAnchor, addPlan } = useAppStore();
  const base = resolveAnchor(anchor, facilityId);
  const [cat, setCat] = useState<(typeof placeCategories)[number]>("전체");
  const places = nearbyPlaces.filter((p) => p.anchor === base && (cat === "전체" || p.category === cat));
  const hasAny = nearbyPlaces.some((p) => p.anchor === base);

  return (
    <>
      <p className="text-sm font-semibold text-muted-foreground">기준 장소</p>
      <div className="mb-4 mt-1 flex flex-wrap items-center gap-2">
        <h1 className="flex items-center gap-1.5 text-2xl font-black text-primary sm:text-3xl"><MapPin className="h-6 w-6" />{base} 주변</h1>
        {anchor && <button onClick={() => setAnchor(null)} className="text-xs font-semibold text-muted-foreground underline">선택 시설 기준으로</button>}
      </div>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {placeCategories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{c}</button>
        ))}
      </div>
      {!hasAny ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">이 장소의 주변 정보는 아직 연결 전이에요.</p>
      ) : places.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">이 조건에 맞는 장소가 없어요.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {places.map((p) => (
            <li key={p.id} className="flex min-w-0 items-center gap-3 rounded-2xl bg-card p-2 shadow-card">
              <img src={p.image} alt="" loading="lazy" width={944} height={704} className="h-20 w-24 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-muted-foreground">{p.category} · 도보 {p.walkMin}분</span>
                <h3 className="truncate text-base font-extrabold">{p.name}</h3>
                <p className="truncate text-sm text-muted-foreground">{p.description}</p>
              </div>
              <button
                aria-label={`${p.name} 계획에 담기`}
                onClick={() => {
                  const added = addPlan({ id: `place:${p.id}`, kind: "place", title: p.name, subtitle: `${base} 주변 · ${p.category}` });
                  if (added) toast.success("방문 계획에 담았어요");
                }}
                className="mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
              >
                <Plus className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
