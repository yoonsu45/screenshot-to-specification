import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LockKeyhole,
  MapPin,
  Trash2,
} from "lucide-react";
import { useAppStore, type PlanItem } from "@/lib/app-store";
import { formatRange, getEvent } from "@/lib/event-service";
import { officialEvents, officialRecordSource, type OfficialRecord } from "@/lib/official-data";
import { getOfficialSchedule } from "@/lib/official-posters";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ParkEvent } from "@/data/events";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "The:Check" },
      { name: "description", content: "담아둔 행사를 월간 달력에서 날짜별로 확인하세요." },
      { property: "og:title", content: "내 방문 계획 — 올팍 행사체크" },
      { property: "og:description", content: "담아둔 행사를 월간 달력에서 날짜별로 확인하세요." },
    ],
  }),
  component: Plan,
});

type PlannedEvent = {
  item: PlanItem;
  startDate: string;
  endDate: string;
  venue: string;
  eventId: string;
  official: OfficialRecord | null;
  demo: ParkEvent | null;
};

const OFFICIAL_EVENT_SITE_URL = "https://www.ticketlink.co.kr/home";

export function Plan() {
  const { plan, removePlan, userEmail, authLoaded, setAuthOpen } = useAppStore();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));
  const [listMode, setListMode] = useState<"day" | "month">("day");
  const [selectedEvent, setSelectedEvent] = useState<PlannedEvent | null>(null);

  const plannedEvents = useMemo<PlannedEvent[]>(() => {
    return plan.flatMap((item) => {
      if (item.kind !== "event") return [];
      const eventId = item.id.startsWith("event:") ? item.id.slice(6) : "";
      const official = officialEvents.find((event) => event.id === eventId) ?? null;
      const demo = getEvent(eventId) ?? null;
      const startDate = item.startDate ?? demo?.startDate ?? official?.startDate ?? undefined;
      if (!startDate) return [];
      return [
        {
          item,
          startDate,
          endDate: item.endDate ?? demo?.endDate ?? startDate,
          venue: item.venue ?? demo?.venue ?? official?.venue ?? "장소 미정",
          eventId,
          official,
          demo,
        },
      ];
    });
  }, [plan]);

  const calendarDays = useMemo(() => buildCalendarDays(month), [month]);
  const selectedEvents = plannedEvents.filter((event) =>
    isDateInRange(selectedDate, event.startDate, event.endDate),
  );
  const savedPlaces = plan.filter((item) => item.kind === "place");
  const monthStart = toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const monthEnd = toDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const monthEventCount = plannedEvents.filter(
    (event) => event.startDate <= monthEnd && event.endDate >= monthStart,
  ).length;
  const monthEvents = plannedEvents
    .filter((event) => event.startDate <= monthEnd && event.endDate >= monthStart)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  const visibleEvents = listMode === "month" ? monthEvents : selectedEvents;
  const visibleEventGroups = visibleEvents.reduce<
    { date: string; events: PlannedEvent[] }[]
  >((groups, event) => {
    const date = listMode === "month" ? event.startDate : selectedDate;
    const current = groups[groups.length - 1];
    if (current?.date === date) current.events.push(event);
    else groups.push({ date, events: [event] });
    return groups;
  }, []);

  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(toDateKey(next));
  }

  function goToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(toDateKey(now));
  }

  function goToMonth(value: string) {
    const [yearPart, monthPart] = value.split("-");
    const requestedYear = Number.parseInt(yearPart ?? "", 10);
    const requestedMonth = Number.parseInt(monthPart ?? "", 10);
    if (!Number.isFinite(requestedYear) || !Number.isFinite(requestedMonth)) return;
    const safeYear = Math.min(2100, Math.max(2000, requestedYear));
    const safeMonth = Math.min(12, Math.max(1, requestedMonth));
    const next = new Date(safeYear, safeMonth - 1, 1);
    setMonth(next);
    setSelectedDate(toDateKey(next));
  }

  if (!authLoaded) {
    return <div className="mx-auto h-72 max-w-4xl animate-pulse rounded-[1.75rem] bg-card" />;
  }

  if (!userEmail) {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] bg-card px-6 py-12 text-center shadow-card sm:px-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary">
          <LockKeyhole className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-primary sm:text-3xl">
          내 방문 계획은 로그인 후 이용할 수 있어요
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          행사와 내부 시설 정보는 로그인 없이 둘러볼 수 있고, 방문 일정을 담을 때만 로그인이 필요해요.
        </p>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="mt-6 rounded-full bg-primary px-6 py-3 font-extrabold text-primary-foreground shadow-fab"
        >
          로그인 또는 회원가입
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
            내 방문 계획
          </h1>
          <span className="mt-3 block h-1.5 w-10 rounded-full bg-brand-orange" />
        </div>
        <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-extrabold text-primary">
          이번 달 {monthEventCount}개
        </span>
      </div>

      <section
        className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-card"
        aria-label="방문 계획 달력"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
            className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-secondary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <label className="relative">
              <span className="sr-only">연도와 월 선택</span>
              <input
                type="month"
                min="2000-01"
                max="2100-12"
                value={toMonthKey(month)}
                onChange={(event) => goToMonth(event.target.value)}
                className="h-10 w-[9.5rem] rounded-xl border border-border bg-background px-2 text-base font-black text-primary sm:w-44 sm:px-3 sm:text-xl"
              />
            </label>
            <button
              type="button"
              onClick={goToday}
              className="rounded-full border border-border px-3 py-1 text-xs font-extrabold text-primary hover:bg-secondary"
            >
              오늘
            </button>
          </div>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
            className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-secondary"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-y border-border bg-secondary/70 text-center text-xs font-extrabold text-muted-foreground sm:text-sm">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={`py-2.5 ${index === 0 ? "text-brand-orange" : index === 6 ? "text-primary" : ""}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border">
          {calendarDays.map((date) => {
            const dateKey = toDateKey(date);
            const dayEvents = plannedEvents.filter((event) =>
              isDateInRange(dateKey, event.startDate, event.endDate),
            );
            const inCurrentMonth = date.getMonth() === month.getMonth();
            const selected = dateKey === selectedDate;
            const isToday = dateKey === toDateKey(today);

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => {
                  setSelectedDate(dateKey);
                  setListMode("day");
                }}
                aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${dayEvents.length ? `, 일정 ${dayEvents.length}개` : ""}`}
                className={`min-h-20 min-w-0 bg-card p-1.5 text-left align-top transition hover:bg-secondary/60 sm:min-h-28 sm:p-2 ${!inCurrentMonth ? "text-muted-foreground/40" : "text-foreground"} ${selected ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold sm:text-sm ${isToday ? "border border-brand-orange text-brand-orange" : ""} ${selected ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {date.getDate()}
                </span>
                <span className="mt-1 block space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span
                      key={event.item.id}
                      className="block truncate rounded bg-brand-orange/10 px-1 py-0.5 text-[9px] font-bold leading-tight text-brand-orange sm:text-[11px]"
                    >
                      {event.item.dateKind === "personal" ? "개인계획 · " : ""}
                      {event.item.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="block px-1 text-[9px] font-bold text-muted-foreground">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {listMode === "month" ? (
              <CalendarRange className="h-5 w-5 shrink-0 text-brand-orange" />
            ) : (
              <CalendarCheck2 className="h-5 w-5 shrink-0 text-brand-orange" />
            )}
            <h2 className="min-w-0 text-lg font-black text-primary">
              {listMode === "month"
                ? `${month.getFullYear()}년 ${month.getMonth() + 1}월 전체 일정`
                : formatSelectedDate(selectedDate)}
            </h2>
          </div>
          <div
            role="group"
            aria-label="일정 표시 범위"
            className="flex rounded-full border border-border bg-card p-1"
          >
            <button
              type="button"
              aria-pressed={listMode === "month"}
              onClick={() => setListMode("month")}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${listMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              이달 전체
            </button>
            <button
              type="button"
              aria-pressed={listMode === "day"}
              onClick={() => setListMode("day")}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${listMode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              선택한 날
            </button>
          </div>
        </div>
        {visibleEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center">
            <p className="font-bold text-muted-foreground">
              {listMode === "month"
                ? "이달에 담은 행사가 없어요."
                : "이 날에 담은 행사가 없어요."}
            </p>
            {plannedEvents.length === 0 && (
              <Link
                to="/events"
                className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
              >
                행사 둘러보기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {visibleEventGroups.map((group) => (
              <section key={group.date} aria-label={`${formatPlanDate(group.date)} 일정`}>
                {listMode === "month" && (
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-primary sm:text-base">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                    {formatPlanDate(group.date)}
                    <span className="text-xs text-muted-foreground">{group.events.length}개</span>
                  </h3>
                )}
                <ul className="space-y-3">
                  {group.events.map((event) => (
                    <li
                      key={event.item.id}
                      className="flex items-center gap-3 rounded-2xl border-l-4 border-brand-orange bg-card p-4 shadow-card"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <CalendarCheck2 className="h-5 w-5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="min-w-0 flex-1 text-left"
                        aria-label={`${event.item.title} 행사 정보 보기`}
                      >
                        <p className="line-clamp-2 break-words font-black text-primary">
                          {event.item.title}
                        </p>
                        <p className="mt-1 text-xs font-bold text-brand-orange">
                          방문 예정일 {formatPlanDate(event.startDate)}
                          {event.item.dateKind === "personal" ? " · 공식 개최일 아님" : ""}
                        </p>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlan(event.item.id)}
                        aria-label={`${event.item.title} 삭제`}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-2xl sm:max-h-[90dvh] sm:w-full">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="break-words pr-6 text-primary [overflow-wrap:anywhere]">
                  {selectedEvent.item.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.official
                    ? officialRecordSource(selectedEvent.eventId)
                    : selectedEvent.demo
                      ? "등록된 행사 정보"
                      : "저장된 방문 계획"}
                </DialogDescription>
              </DialogHeader>

              {selectedEvent.official ? (
                <OfficialPosterImage
                  eventId={selectedEvent.eventId}
                  title={selectedEvent.item.title}
                  className="max-h-64 min-h-32 w-full rounded-xl"
                />
              ) : selectedEvent.demo ? (
                <img
                  src={selectedEvent.demo.image}
                  alt={`${selectedEvent.item.title} 포스터`}
                  className="max-h-64 min-h-32 w-full rounded-xl object-cover"
                />
              ) : null}

              <div className="space-y-3 break-words rounded-xl bg-muted/50 p-4 text-sm [overflow-wrap:anywhere]">
                <p>
                  <strong>방문 예정일</strong> {formatPlanDate(selectedEvent.startDate)}
                </p>
                <p>
                  <strong>행사 일정</strong>{" "}
                  {selectedEvent.official
                    ? getOfficialSchedule(selectedEvent.eventId).raw ||
                      selectedEvent.official.startDate ||
                      "확인 불가"
                    : selectedEvent.demo
                      ? formatRange(selectedEvent.demo)
                      : "확인 불가"}
                </p>
                <p>
                  <strong>장소</strong> {selectedEvent.venue}
                </p>
                {selectedEvent.item.dateKind === "personal" && (
                  <p className="font-bold text-brand-orange">
                    선택한 날짜는 개인 방문예정일이며 공식 개최일이 아닙니다.
                  </p>
                )}
              </div>

              {selectedEvent.official || selectedEvent.demo?.officialUrl ? (
                <a
                  href={selectedEvent.demo?.officialUrl ?? OFFICIAL_EVENT_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-extrabold text-primary-foreground"
                >
                  <ExternalLink className="h-4 w-4" /> 티켓링크 예매
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
                  연결된 공식 홈페이지가 없는 행사입니다.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {savedPlaces.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-orange" />
            <h2 className="text-lg font-black text-primary">날짜를 정하지 않은 장소</h2>
          </div>
          <ul className="space-y-3">
            {savedPlaces.map((place) => (
              <li
                key={place.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-primary">{place.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{place.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePlan(place.id)}
                  aria-label={`${place.title} 삭제`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay());
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isDateInRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

function formatSelectedDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatPlanDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
