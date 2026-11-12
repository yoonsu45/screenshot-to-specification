import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventCategory, ParkEvent } from "@/data/events";
import { EventCard } from "@/components/app/EventCard";

type Props = {
  events: ParkEvent[];
  showFacility?: boolean;
};

export function EventCalendar({ events, showFacility }: Props) {
  const firstEventDate = events[0]?.startDate ?? toDateKey(new Date());
  const [month, setMonth] = useState(() => monthFromDateKey(firstEventDate));
  const [selectedDate, setSelectedDate] = useState(firstEventDate);
  const eventKey = events.map((event) => `${event.id}:${event.category}:${event.startDate}:${event.endDate ?? ""}`).join("|");

  useEffect(() => {
    const nextDate = events[0]?.startDate;
    if (!nextDate) return;
    setMonth(monthFromDateKey(nextDate));
    setSelectedDate(nextDate);
  }, [eventKey]);

  const calendarDays = useMemo(() => buildCalendarDays(month), [month]);
  const visibleCategories = useMemo(() => Array.from(new Set(events.map((event) => event.category))), [eventKey]);
  const selectedEvents = events.filter((event) => isEventOnDate(event, selectedDate));

  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(toDateKey(next));
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-card" aria-label="다가오는 행사 달력">
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
            className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-secondary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="flex items-center gap-2 text-xl font-black text-primary sm:text-2xl">
            <CalendarDays className="h-5 w-5 text-brand-orange" />
            {month.getFullYear()}년 {month.getMonth() + 1}월
          </h2>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
            className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-secondary"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="border-t border-border px-4 py-3 sm:px-6" aria-label="카테고리별 색상">
          <p className="mb-2 text-xs font-extrabold text-muted-foreground">카테고리별 색상</p>
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((category) => {
              const color = getCategoryColor(category);
              return (
                <span key={category} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${color.background} ${color.text}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
                  {category}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-7 border-y border-border bg-secondary/70 text-center text-xs font-extrabold text-muted-foreground sm:text-sm">
          {WEEKDAYS.map((day, index) => (
            <div key={day} className={`py-2.5 ${index === 0 ? "text-brand-orange" : index === 6 ? "text-primary" : ""}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border">
          {calendarDays.map((date) => {
            const dateKey = toDateKey(date);
            const dayEvents = events.filter((event) => isEventOnDate(event, dateKey));
            const inCurrentMonth = date.getMonth() === month.getMonth();
            const selected = dateKey === selectedDate;

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${dayEvents.length ? `, 행사 ${dayEvents.length}개` : ""}`}
                className={`min-h-20 min-w-0 bg-card p-1 text-left align-top transition hover:bg-secondary/60 sm:min-h-28 sm:p-2 ${!inCurrentMonth ? "text-muted-foreground/35" : "text-foreground"} ${selected ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold sm:text-sm ${selected ? "bg-primary text-primary-foreground" : ""}`}>
                  {date.getDate()}
                </span>
                <span className="mt-1 block space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <EventLabel key={event.id} event={event} />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="block px-1 text-[9px] font-bold text-muted-foreground">+{dayEvents.length - 2}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-primary">{formatSelectedDate(selectedDate)} 행사</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-primary">{selectedEvents.length}개</span>
        </div>
        {selectedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center font-bold text-muted-foreground">
            이 날짜에 예정된 행사가 없어요.
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {selectedEvents.map((event) => (
              <li key={event.id} className="min-w-0">
                <EventCard
                  event={event}
                  showFacility={showFacility}
                  onClick={event.officialUrl ? () => window.open(event.officialUrl, "_blank", "noopener") : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const CATEGORY_COLORS: Record<EventCategory, { background: string; text: string; border: string; dot: string }> = {
  공연: { background: "bg-blue-100", text: "text-blue-800", border: "border-blue-500", dot: "bg-blue-500" },
  체험: { background: "bg-orange-100", text: "text-orange-800", border: "border-orange-500", dot: "bg-orange-500" },
  전시: { background: "bg-violet-100", text: "text-violet-800", border: "border-violet-500", dot: "bg-violet-500" },
  프로그램: { background: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-500", dot: "bg-emerald-500" },
};

function EventLabel({ event }: { event: ParkEvent }) {
  const color = getCategoryColor(event.category);
  return (
    <span className={`block truncate rounded border-l-2 px-1 py-0.5 text-[9px] font-bold leading-tight sm:text-[11px] ${color.background} ${color.text} ${color.border}`}>
      {event.title}
    </span>
  );
}

function getCategoryColor(category: EventCategory) {
  return CATEGORY_COLORS[category];
}

function monthFromDateKey(dateKey: string) {
  const [year, month] = dateKey.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1);
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isEventOnDate(event: ParkEvent, dateKey: string) {
  return dateKey >= event.startDate && dateKey <= (event.endDate ?? event.startDate);
}

function formatSelectedDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(date);
}
