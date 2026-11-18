import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  PlugZap,
  ScanLine,
  SearchX,
} from "lucide-react";
import { categories, type CategoryFilter } from "@/data/events";
import { ALL_FACILITIES_ID } from "@/data/facilities";
import { listEvents } from "@/lib/event-service";
import { useAppStore } from "@/lib/app-store";
import { EventCard } from "@/components/app/EventCard";
import { EventCalendar } from "@/components/app/EventCalendar";
import { OfficialEventBrowser } from "@/components/app/OfficialEventBrowser";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "The:Check" },
      {
        name: "description",
        content: "올림픽공원과 국민체육진흥공단 시설의 공개 행사를 날짜순으로 확인하세요.",
      },
      { property: "og:title", content: "올팍 행사체크 — 시설별 행사 목록" },
      {
        property: "og:description",
        content: "올림픽공원과 주요 시설의 공개 행사를 날짜순으로 확인하세요.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { facilityId, setCheckOpen } = useAppStore();
  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [dataSource, setDataSource] = useState<"official" | "demo">("official");
  useEffect(() => setCategory("전체"), [facilityId]);

  const isAll = facilityId === ALL_FACILITIES_ID;
  const result = listEvents(facilityId, category);

  return (
    <>
      <button
        type="button"
        onClick={() => setCheckOpen(true)}
        aria-label="캡처 이미지를 올려 행사 바로 확인하기"
        className="group mb-9 flex w-full items-center justify-between gap-3 overflow-hidden rounded-[2rem] bg-[linear-gradient(115deg,#edf4ff_0%,#e7effc_100%)] px-5 py-6 text-left transition hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99] sm:gap-4 sm:px-8 sm:py-8"
      >
        <span className="min-w-0">
          <span className="block text-2xl font-black text-primary sm:text-3xl">
            캡처로 행사 확인
          </span>
          <span className="mt-2 block text-sm font-medium leading-relaxed text-primary/90 sm:text-lg">
            <span className="block">SNS에서 본 행사,</span>
            <span className="block">공식 일정과 비교해요</span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-center gap-1.5 text-primary">
          <span className="flex items-center gap-1.5 sm:gap-3">
            <span className="relative grid h-14 w-14 place-items-center sm:h-20 sm:w-20">
              <ScanLine className="absolute h-full w-full stroke-[1.5]" />
              <Camera className="h-7 w-7 sm:h-10 sm:w-10" />
            </span>
            <ArrowRight className="h-7 w-7 text-brand-orange transition group-hover:translate-x-1 sm:h-8 sm:w-8" />
          </span>
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold text-primary-foreground sm:text-xs">
            눌러서 바로 확인
          </span>
        </span>
      </button>

      <div role="group" aria-label="행사 자료 선택" className="mb-6 grid grid-cols-2 gap-2">
        {(["official", "demo"] as const).map((source) => (
          <button
            key={source}
            type="button"
            aria-pressed={dataSource === source}
            onClick={() => setDataSource(source)}
            className={`rounded-xl border px-4 py-3 font-bold ${dataSource === source ? "bg-primary text-primary-foreground" : "bg-card text-primary"}`}
          >
            {source === "official" ? "공식 공공데이터" : "시연용 일정"}
          </button>
        ))}
      </div>
      {dataSource === "official" ? (
        <OfficialEventBrowser />
      ) : (
        <>
          <div className="mb-5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-2xl font-black tracking-tight text-primary sm:text-4xl">
                시연용 행사 일정
              </h1>
              <span className="mt-2.5 block h-1.5 w-10 rounded-full bg-brand-orange sm:mt-3" />
            </div>
            <button
              type="button"
              aria-expanded={calendarOpen}
              aria-controls="demo-event-calendar"
              onClick={() => setCalendarOpen((open) => !open)}
              className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-extrabold text-primary shadow-sm transition hover:bg-secondary sm:text-sm"
            >
              <CalendarDays className="h-4 w-4" />
              {calendarOpen ? "달력 접기" : "달력 펼치기"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${calendarOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            시연용 예시 데이터입니다. 실제 행사 일정이 아닙니다. 공식 API 자료는 행사 확인 화면에서
            검색할 수 있습니다.
          </p>
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
            <Empty
              icon={<PlugZap className="h-8 w-8" />}
              title="공개 일정 연결 전"
              desc="이 시설의 공개 일정은 아직 연결되지 않았어요."
            />
          )}
          {result.kind === "empty" && (
            <Empty
              icon={<SearchX className="h-8 w-8" />}
              title="이 조건에 맞는 행사가 없어요"
              desc="다른 분류나 시설을 선택해 보세요."
            />
          )}
          {result.kind === "ok" && (
            <div className="space-y-6">
              {calendarOpen && (
                <div id="demo-event-calendar">
                  <EventCalendar events={result.events} showFacility={isAll} />
                </div>
              )}
              <section aria-labelledby="demo-event-list-title">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id="demo-event-list-title" className="text-xl font-black text-primary">
                    행사 목록
                  </h2>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-primary">
                    {result.events.length}개
                  </span>
                </div>
                <ul className="grid gap-4 lg:grid-cols-2">
                  {result.events.map((e) => (
                    <li key={e.id} className="min-w-0">
                      <EventCard
                        event={e}
                        showFacility={isAll}
                        onClick={
                          e.officialUrl
                            ? () => window.open(e.officialUrl, "_blank", "noopener")
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </>
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
