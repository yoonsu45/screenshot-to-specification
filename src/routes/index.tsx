import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  MapPin,
  Ticket,
  UsersRound,
} from "lucide-react";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import { OfficialEventSaveButton } from "@/components/app/OfficialEventSaveButton";
import { ParkEventSaveButton } from "@/components/app/ParkEventSaveButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { events, type ParkEvent } from "@/data/events";
import { olympicParkVenueDestinations } from "@/data/transit";
import { useAppStore } from "@/lib/app-store";
import { formatRange } from "@/lib/event-service";
import { officialEvents, officialRecordSource, type OfficialRecord } from "@/lib/official-data";
import { getOfficialSchedule } from "@/lib/official-posters";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The:Check" },
      {
        name: "description",
        content: "이번 달 행사와 공연장별 인기 행사를 확인하세요.",
      },
      { property: "og:title", content: "The:Check — 올림픽공원 행사 홈" },
      {
        property: "og:description",
        content: "이번 달 행사와 공연장별 인기 행사를 한눈에 확인하세요.",
      },
    ],
  }),
  component: HomePage,
});

type RankedEvent = {
  id: string;
  title: string;
  venue: string;
  count: number;
  demo: boolean;
  endDate: string | null;
};

const venueOptions = olympicParkVenueDestinations.map((venue) => venue.name);
const venueOptionSet = new Set<string>(venueOptions);

function canonicalVenue(value: string) {
  if (/뮤즈라이브/.test(value)) return "뮤즈라이브";
  if (/KSPO[-\s]?DOME|체조경기장|케이스포돔/i.test(value)) return "KSPO-DOME";
  if (/티켓링크 라이브 아레나|핸드볼경기장/.test(value)) return "티켓링크 라이브 아레나";
  if (/우리금융아트홀|역도경기장/.test(value)) return "우리금융아트홀";
  if (/올림픽홀/.test(value)) return "올림픽홀";
  if (/88(?:잔디)?마당/.test(value)) return "88마당";
  if (/평화의\s?광장/.test(value)) return "평화의 광장";
  if (/만남의\s?광장/.test(value)) return "만남의 광장";
  if (/수변무대/.test(value)) return "수변무대";
  if (/한얼광장/.test(value)) return "한얼광장";
  if (/피크닉\s?(?:광장|장)/.test(value)) return "피크닉 광장";
  return value;
}

function rankEvents(catalog: RankedEvent[]) {
  return catalog
    .slice()
    .sort(
      (left, right) =>
        right.count - left.count ||
        Number(right.demo) - Number(left.demo) ||
        left.title.localeCompare(right.title, "ko"),
    )
    .slice(0, 5);
}

export function getMonthlyDemoEvents(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;
  return events.filter(
    (event) => event.startDate <= monthEnd && (event.endDate ?? event.startDate) >= monthStart,
  );
}

export function buildHomeRankings(
  eventSaveCounts: Record<string, number>,
  referenceDate = new Date(),
) {
  const todayKey = toKoreaDateKey(referenceDate);
  const catalog: RankedEvent[] = [
    ...events.map((event) => ({
      id: event.id,
      title: event.title,
      venue: canonicalVenue(event.venue),
      count: eventSaveCounts[event.id] ?? 0,
      demo: true,
      endDate: event.endDate ?? event.startDate,
    })),
    ...officialEvents.map((event) => {
      const schedule = getOfficialSchedule(event.id);
      return {
        id: event.id,
        title: event.title,
        venue: canonicalVenue(event.venue || "장소 확인 불가"),
        count: eventSaveCounts[event.id] ?? 0,
        demo: false,
        endDate: schedule.dates[schedule.dates.length - 1] ?? event.startDate,
      };
    }),
  ].filter(
    (event) =>
      venueOptionSet.has(event.venue) && (!event.endDate || event.endDate >= todayKey),
  );
  return {
    popular: rankEvents(catalog),
    byVenue: Object.fromEntries(
      venueOptions.map((venue) => [
        venue,
        rankEvents(catalog.filter((event) => event.venue === venue)),
      ]),
    ) as Record<string, RankedEvent[]>,
  };
}

function toKoreaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}

function HomePage() {
  const { eventSaveCounts } = useAppStore();
  const today = useMemo(() => new Date(), []);
  const [slide, setSlide] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState("전체");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const dragStartX = useRef<number | null>(null);
  const suppressPosterClick = useRef(false);
  const monthlyEvents = useMemo(() => getMonthlyDemoEvents(today), [today]);

  useEffect(() => {
    if (monthlyEvents.length < 2) return;
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % monthlyEvents.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [monthlyEvents.length]);

  const rankings = useMemo(() => buildHomeRankings(eventSaveCounts), [eventSaveCounts]);
  const visibleRanking =
    selectedVenue === "전체" ? rankings.popular : (rankings.byVenue[selectedVenue] ?? []);

  const activeEvent = monthlyEvents[slide % Math.max(1, monthlyEvents.length)];

  function moveSlide(offset: number) {
    if (!monthlyEvents.length) return;
    setSlide((current) => (current + offset + monthlyEvents.length) % monthlyEvents.length);
  }

  function startSwipe(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) return;
    suppressPosterClick.current = false;
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSwipe(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(distance) < 45) return;
    suppressPosterClick.current = true;
    moveSlide(distance < 0 ? 1 : -1);
  }

  function openPosterDetails(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) return;
    if (suppressPosterClick.current) {
      suppressPosterClick.current = false;
      return;
    }
    if (activeEvent) setSelectedEventId(activeEvent.id);
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="monthly-events-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-brand-orange">
              {today.getFullYear()}년 {today.getMonth() + 1}월
            </p>
            <h1 id="monthly-events-title" className="text-3xl font-black text-primary sm:text-4xl">
              이번 달 행사
            </h1>
          </div>
          <Link to="/events" className="text-sm font-extrabold text-primary underline underline-offset-4">
            전체 행사 보기
          </Link>
        </div>

        {activeEvent ? (
          <div
            className="relative touch-pan-y select-none overflow-hidden rounded-[2rem] bg-card shadow-card sm:cursor-grab sm:active:cursor-grabbing"
            onPointerDown={startSwipe}
            onPointerUp={finishSwipe}
            onClick={openPosterDetails}
            onKeyDown={(event) => {
              if ((event.target as HTMLElement).closest("button, a")) return;
              if ((event.key === "Enter" || event.key === " ") && activeEvent) {
                event.preventDefault();
                setSelectedEventId(activeEvent.id);
              }
            }}
            onPointerCancel={() => {
              dragStartX.current = null;
            }}
            role="button"
            tabIndex={0}
            aria-label={`${activeEvent.title} 상세 정보 보기`}
          >
            <div className="relative flex h-72 items-center justify-center bg-black/95 sm:h-96">
              <img
                key={activeEvent.id}
                src={activeEvent.image}
                alt={`${activeEvent.title} 포스터`}
                draggable={false}
                className="h-full w-full object-contain"
              />
              {monthlyEvents.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveSlide(-1)}
                    aria-label="이전 포스터"
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(1)}
                    aria-label="다음 포스터"
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            <div className="p-5 sm:p-7">
              <span className="inline-flex rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-extrabold text-white">
                시연용
              </span>
              <h2 className="mt-2 line-clamp-2 text-2xl font-black text-primary sm:text-3xl">
                {activeEvent.title}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {formatRange(activeEvent)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {activeEvent.venue}
                </span>
              </p>
              <ParkEventSaveButton event={activeEvent} className="mt-4" />
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
            이번 달에 등록된 행사가 없어요.
          </div>
        )}
        {monthlyEvents.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label="포스터 위치">
            {monthlyEvents.map((event, index) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSlide(index)}
                aria-label={`${index + 1}번째 포스터 보기`}
                className={`h-2.5 rounded-full transition-all ${index === slide ? "w-7 bg-primary" : "w-2.5 bg-border"}`}
              />
            ))}
            <span className="ml-1 text-xs font-semibold text-muted-foreground">
              좌우로 밀어 넘기기
            </span>
          </div>
        )}
      </section>

      <RankingSection
        title="인기 행사"
        icon={<Flame className="h-6 w-6" />}
        controls={
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
            {["전체", ...venueOptions].map((venue) => (
              <button
                key={venue}
                type="button"
                aria-pressed={selectedVenue === venue}
                onClick={() => setSelectedVenue(venue)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold ${selectedVenue === venue ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary"}`}
              >
                {venue}
              </button>
            ))}
          </div>
        }
      >
        {visibleRanking.map((event, index) => (
          <li key={event.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
            <button
              type="button"
              onClick={() => setSelectedEventId(event.id)}
              aria-label={`${event.title} 상세 정보 보기`}
              className="flex w-full min-w-0 items-center gap-3 p-4 text-left transition hover:bg-secondary/60 focus-visible:bg-secondary/60"
            >
              <RankNumber value={index + 1} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-primary">{event.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.venue}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-extrabold text-brand-orange">
                <UsersRound className="h-4 w-4" /> {event.count.toLocaleString("ko-KR")}명
              </span>
            </button>
          </li>
        ))}
        {visibleRanking.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-muted-foreground">
            이 장소의 등록된 행사가 없어요.
          </li>
        )}
      </RankingSection>
      <HomeEventDetails eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
    </div>
  );
}

function HomeEventDetails({ eventId, onClose }: { eventId: string | null; onClose: () => void }) {
  const demoEvent = eventId ? events.find((event) => event.id === eventId) : undefined;
  const officialEvent = eventId
    ? officialEvents.find((event) => event.id === eventId)
    : undefined;

  return (
    <Dialog open={Boolean(eventId && (demoEvent || officialEvent))} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-2xl p-0 sm:max-h-[90dvh] sm:w-full">
        <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 pt-12 sm:max-h-[90dvh] sm:p-6 sm:pt-10">
          {demoEvent ? (
            <DemoEventDetails event={demoEvent} />
          ) : officialEvent ? (
            <OfficialEventDetails event={officialEvent} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DemoEventDetails({ event }: { event: ParkEvent }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="break-words pr-6 text-primary [overflow-wrap:anywhere]">
          {event.title}
        </DialogTitle>
        <DialogDescription>{event.category} · {event.venue}</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="flex max-h-[65dvh] items-center justify-center overflow-hidden rounded-xl bg-black/95">
          <img
            src={event.image}
            alt={`${event.title} 포스터`}
            className="max-h-[65dvh] max-w-full object-contain"
          />
        </div>
        <div className="space-y-3 break-words rounded-xl bg-muted/50 p-4 text-sm [overflow-wrap:anywhere]">
          <DetailLine icon={<CalendarDays className="h-4 w-4" />}>{formatRange(event)}</DetailLine>
          {event.startTime && (
            <DetailLine icon={<Clock3 className="h-4 w-4" />}>
              {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
            </DetailLine>
          )}
          <DetailLine icon={<MapPin className="h-4 w-4" />}>
            {event.venueDetail ?? event.venue}{event.address ? ` · ${event.address}` : ""}
          </DetailLine>
          {event.admission && (
            <DetailLine icon={<Ticket className="h-4 w-4" />}>입장: {event.admission}</DetailLine>
          )}
          {event.description && <p className="leading-relaxed text-muted-foreground">{event.description}</p>}
        </div>
        <ParkEventSaveButton event={event} className="w-full" />
      </div>
    </>
  );
}

function OfficialEventDetails({ event }: { event: OfficialRecord }) {
  const schedule = getOfficialSchedule(event.id);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="break-words pr-6 text-primary [overflow-wrap:anywhere]">
          {event.title}
        </DialogTitle>
        <DialogDescription>행사 상세 정보</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <OfficialPosterImage
          eventId={event.id}
          title={event.title}
          className="max-h-[65dvh] min-h-40 w-full rounded-xl"
        />
        <div className="space-y-3 break-words rounded-xl bg-muted/50 p-4 text-sm [overflow-wrap:anywhere]">
          <DetailLine icon={<CalendarDays className="h-4 w-4" />}>
            {schedule.raw || event.startDate || "날짜 확인 불가"}
          </DetailLine>
          <DetailLine icon={<MapPin className="h-4 w-4" />}>
            {event.venue || "장소 확인 불가"}
          </DetailLine>
          <p className="text-xs text-muted-foreground">출처: {officialRecordSource(event.id)}</p>
        </div>
        <OfficialEventSaveButton event={event} className="w-full" />
      </div>
    </>
  );
}

function DetailLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function RankingSection({
  title,
  icon,
  controls,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-center gap-2 text-primary">
        <span className="text-brand-orange">{icon}</span>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      {controls && <div className="mb-4">{controls}</div>}
      <ol className="space-y-3">{children}</ol>
    </section>
  );
}

function RankNumber({ value }: { value: number }) {
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-black ${value === 1 ? "bg-brand-orange text-white" : "bg-secondary text-primary"}`}>
      {value}
    </span>
  );
}
