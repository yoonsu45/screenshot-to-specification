import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, PlugZap, SearchX } from "lucide-react";
import { categories, type CategoryFilter } from "@/data/events";
import { ALL_FACILITIES_ID, getFacility } from "@/data/facilities";
import { listEvents } from "@/lib/event-service";
import { useAppStore } from "@/lib/app-store";
import { EventCard } from "@/components/app/EventCard";
import { FacilityPicker } from "@/components/app/FacilityPicker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "올팍 행사체크 — 시설별 행사 목록" },
      { name: "description", content: "올림픽공원과 국민체육진흥공단 시설의 공개 행사를 날짜순으로 확인하세요." },
      { property: "og:title", content: "올팍 행사체크 — 시설별 행사 목록" },
      { property: "og:description", content: "올림픽공원과 주요 시설의 공개 행사를 날짜순으로 확인하세요." },
    ],
  }),
  component: Home,
});

function Home() {
  const { facilityId, setFacilityId } = useAppStore();
  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [open, setOpen] = useState(false);
  useEffect(() => setCategory("전체"), [facilityId]);

  const facility = getFacility(facilityId);
  const isAll = facilityId === ALL_FACILITIES_ID;
  const title = isAll ? "전체 시설 행사" : `${facility?.name} 행사`;
  const result = listEvents(facilityId, category);

  return (
    <>
      <p className="text-sm font-semibold text-muted-foreground">장소 선택</p>
      <div className="mb-4 mt-1 flex min-w-0 items-center gap-2">
        <button onClick={() => setOpen(true)} className="flex min-w-0 items-center gap-1 rounded-2xl bg-lime/60 px-3 py-1.5 text-left" aria-label="장소 선택 열기">
          <h1 className="title-highlight truncate text-2xl font-black text-primary sm:text-3xl lg:text-4xl">{title}</h1>
          <ChevronDown className="h-6 w-6 shrink-0 text-primary" />
        </button>
        <span className="shrink-0 rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-lime-foreground">시연용</span>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {result.kind === "not-connected" && (
        <Empty icon={<PlugZap className="h-8 w-8" />} title="공개 일정 연결 전" desc="이 시설의 공개 일정은 아직 연결되지 않았어요." />
      )}
      {result.kind === "empty" && (
        <Empty icon={<SearchX className="h-8 w-8" />} title="이 조건에 맞는 행사가 없어요" desc="다른 분류나 시설을 선택해 보세요." />
      )}
      {result.kind === "ok" && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {result.events.map((e) => (
            <li key={e.id} className="min-w-0">
              <EventCard event={e} showFacility={isAll} onClick={e.officialUrl ? () => window.open(e.officialUrl, "_blank", "noopener") : undefined} />
            </li>
          ))}
        </ul>
      )}

      <FacilityPicker
        open={open}
        onOpenChange={setOpen}
        selectedId={facilityId}
        onSelect={(id) => {
          setFacilityId(id);
          setOpen(false);
        }}
      />
    </>
  );
}

function Empty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="mb-3 text-muted-foreground">{icon}</span>
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
