import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Camera, List, PlugZap, ScanLine, SearchX } from "lucide-react";
import { categories, type CategoryFilter } from "@/data/events";
import { ALL_FACILITIES_ID } from "@/data/facilities";
import { listEvents } from "@/lib/event-service";
import { useAppStore } from "@/lib/app-store";
import { EventCard } from "@/components/app/EventCard";
import { EventCalendar } from "@/components/app/EventCalendar";

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
  const { facilityId, setCheckOpen } = useAppStore();
  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  useEffect(() => setCategory("전체"), [facilityId]);

  const isAll = facilityId === ALL_FACILITIES_ID;
  const result = listEvents(facilityId, category);

  return (
    <>
      <button type="button" onClick={() => setCheckOpen(true)} className="group mb-9 flex w-full items-center justify-between gap-4 overflow-hidden rounded-[2rem] bg-[linear-gradient(115deg,#edf4ff_0%,#e7effc_100%)] px-6 py-7 text-left transition hover:-translate-y-0.5 hover:shadow-card sm:px-8 sm:py-8">
        <span className="min-w-0">
          <span className="block text-2xl font-black text-primary sm:text-3xl">캡처로 행사 확인</span>
          <span className="mt-2 block text-sm font-medium text-primary/90 sm:text-lg">SNS에서 본 행사, 공식 일정과 비교해요</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-primary">
          <span className="relative grid h-16 w-16 place-items-center sm:h-20 sm:w-20">
            <ScanLine className="absolute h-full w-full stroke-[1.5]" />
            <Camera className="h-8 w-8 sm:h-10 sm:w-10" />
          </span>
          <ArrowRight className="h-8 w-8 text-brand-orange transition group-hover:translate-x-1" />
        </span>
      </button>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">다가오는 행사</h1>
          <span className="mt-3 block h-1.5 w-10 rounded-full bg-brand-orange" />
        </div>
        <div className="flex rounded-full border border-border bg-card p-1 shadow-sm" role="group" aria-label="행사 보기 방식">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            aria-pressed={viewMode === "calendar"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-extrabold transition sm:px-4 ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-primary"}`}
          >
            <CalendarDays className="h-4 w-4" /> 달력 보기
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-extrabold transition sm:px-4 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-primary"}`}
          >
            <List className="h-4 w-4" /> 목록 보기
          </button>
        </div>
      </div>

      <div className="-mx-5 mb-7 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-6 py-3 text-base font-extrabold transition ${category === c ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/30"}`}
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
        viewMode === "calendar" ? (
          <EventCalendar events={result.events} showFacility={isAll} />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {result.events.map((e) => (
              <li key={e.id} className="min-w-0">
                <EventCard event={e} showFacility={isAll} onClick={e.officialUrl ? () => window.open(e.officialUrl, "_blank", "noopener") : undefined} />
              </li>
            ))}
          </ul>
        )
      )}

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
