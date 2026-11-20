import { useEffect, useState } from "react";
import { Bookmark, CalendarDays, MapPin, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import { TicketlinkBookingButton } from "@/components/app/TicketlinkBookingButton";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";
import { getOfficialPoster, getOfficialSchedule } from "@/lib/official-posters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/app-store";
import { searchOfficialEvents } from "@/lib/event-service";
import { officialRecordSource } from "@/lib/official-data";

const PAGE_SIZE = 20;

export function OfficialEventBrowser() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [selected, setSelected] = useState<ReturnType<typeof searchOfficialEvents>[number] | null>(
    null,
  );
  const [savingEvent, setSavingEvent] = useState<
    ReturnType<typeof searchOfficialEvents>[number] | null
  >(null);
  const [pending, setPending] = useState(false);
  const { plan, addPlan, removePlan, requireAuth, eventSaveCounts, setAnchor } = useAppStore();
  async function toggleSave(event: ReturnType<typeof searchOfficialEvents>[number]) {
    if (pending || !requireAuth()) return;
    if (plan.some((item) => item.id === `event:${event.id}`)) {
      setPending(true);
      try {
        const ok = await removePlan(`event:${event.id}`);
        if (ok) toast.success("방문 계획에서 뺐어요.");
        else toast.error("담기 취소에 실패했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setPending(false);
      }
    } else setSavingEvent(event);
  }
  const matches = searchOfficialEvents(query)
    .sort(
      (left, right) =>
        Number(Boolean(getOfficialPoster(right.id))) - Number(Boolean(getOfficialPoster(left.id))),
    );
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = matches.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  useEffect(() => {
    setPageInput(String(currentPage + 1));
  }, [currentPage]);

  useEffect(() => {
    if (selected?.venue && typeof setAnchor === "function") setAnchor(selected.venue);
  }, [selected?.venue, setAnchor]);

  function goToPage() {
    const requestedPage = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(requestedPage)) {
      setPageInput(String(currentPage + 1));
      return;
    }
    setPage(Math.min(pageCount, Math.max(1, requestedPage)) - 1);
  }

  return (
    <section className="space-y-5" aria-label="공식 공공데이터 행사 조회">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
          공식 행사 정보
        </h1>
        <span className="mt-3 block h-1.5 w-10 rounded-full bg-brand-orange" />
      </div>
      <label className="block">
        <span className="sr-only">공식 행사명·장소 검색</span>
        <input
          type="search"
          className="h-12 w-full rounded-xl border border-input bg-card px-4"
          placeholder="행사명 또는 장소를 입력하세요"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
      </label>
      <p role="status" className="text-sm text-muted-foreground">
        검색 결과 {matches.length.toLocaleString("ko-KR")}건
      </p>
      {!matches.length && (
        <p className="rounded-xl bg-card p-6">
          일치하는 자료가 없습니다. 검색 결과가 없다는 이유만으로 허위 행사로 판단하지 않습니다.
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-2">
        {visible.map((event) => (
          <li key={event.id} className="min-w-0">
            <article className="flex w-full min-w-0 items-center gap-2 rounded-[1.75rem] bg-card p-3 shadow-card transition hover:-translate-y-0.5 sm:p-4">
              <button
                type="button"
                aria-label={`${event.title} 상세 보기`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                onClick={() => setSelected(event)}
              >
                <OfficialPosterImage
                  eventId={event.id}
                  title={event.title}
                  className="h-24 w-24 shrink-0 rounded-[1.35rem] sm:h-32 sm:w-40"
                />
                <span className="min-w-0 flex-1 py-1">
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {officialRecordSource(event.id)}
                  </span>
                  <span className="mb-3 line-clamp-2 text-xl font-black leading-tight text-primary sm:text-2xl">
                    {event.title}
                  </span>
                  <span className="flex min-w-0 items-start gap-2 text-sm">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                      {getOfficialSchedule(event.id).raw
                        ? `${getOfficialSchedule(event.id).raw}${getOfficialSchedule(event.id).issue ? " · 확인 필요" : ""}`
                        : event.startDate || "날짜 확인 불가"}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    <span className="truncate">{event.venue || "장소 확인 불가"}</span>
                  </span>
                  <span className="mt-2 flex min-w-0 items-start gap-1.5 text-xs font-bold text-brand-orange sm:text-sm">
                    <UsersRound className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words">
                      {eventSaveCounts[event.id] === undefined
                        ? "담은 인원 확인 중"
                        : `${eventSaveCounts[event.id]!.toLocaleString("ko-KR")}명이 일정에 담았어요`}
                    </span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={pending}
                aria-label={
                  plan.some((item) => item.id === `event:${event.id}`)
                    ? "방문 계획에서 빼기"
                    : "방문 계획에 담기"
                }
                onClick={() => void toggleSave(event)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary hover:bg-secondary disabled:opacity-40 sm:h-12 sm:w-12"
              >
                <Bookmark
                  className={`h-7 w-7 ${plan.some((item) => item.id === `event:${event.id}`) ? "fill-brand-orange text-brand-orange" : ""}`}
                />
              </button>
            </article>
          </li>
        ))}
      </ul>
      {matches.length > 0 && (
        <nav aria-label="공식 자료 페이지" className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-xl border px-4 py-2 disabled:opacity-40"
          >
            이전
          </button>
          <span>
            {currentPage + 1} / {pageCount}
          </span>
          <form
            className="flex items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              goToPage();
            }}
          >
            <label htmlFor="official-page-number" className="sr-only">
              이동할 페이지
            </label>
            <input
              id="official-page-number"
              type="number"
              inputMode="numeric"
              min={1}
              max={pageCount}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              className="h-10 w-16 rounded-xl border border-input bg-card px-2 text-center"
            />
            <button type="submit" className="h-10 rounded-xl border px-3 font-semibold">
              이동
            </button>
          </form>
          <button
            type="button"
            disabled={currentPage + 1 >= pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="rounded-xl border px-4 py-2 disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-2xl p-0 sm:max-h-[90dvh] sm:w-full">
          <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 pt-12 sm:max-h-[90dvh] sm:p-6 sm:pt-10">
            <DialogHeader>
            <DialogTitle className="break-words pr-6 text-primary [overflow-wrap:anywhere]">
              {selected?.title}
            </DialogTitle>
              <DialogDescription className="sr-only">행사 상세 정보</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="mt-4 space-y-4">
                <OfficialPosterImage
                  key={selected.id}
                  eventId={selected.id}
                  title={selected.title}
                  className="max-h-64 min-h-32 w-full rounded-xl"
                />
                <div className="space-y-3 break-words rounded-xl bg-muted/50 p-4 text-sm [overflow-wrap:anywhere]">
                  <p>
                    개최일:{" "}
                    {getOfficialSchedule(selected.id).raw || selected.startDate || "확인 불가"}
                  </p>
                  {getOfficialSchedule(selected.id).raw && (
                    <p>개최일 출처: 공식 공연 포스터 정보</p>
                  )}
                  {getOfficialSchedule(selected.id).issue && (
                    <p className="font-bold text-brand-orange">
                      {getOfficialSchedule(selected.id).issue}
                    </p>
                  )}
                  <p>장소: {selected.venue || "확인 불가"}</p>
                  <p>출처: {officialRecordSource(selected.id)}</p>
                  {getOfficialPoster(selected.id) && (
                    <>
                      <p>포스터 출처: 한국체육산업개발 공연 포스터 정보</p>
                      <p>
                        포스터 자료의 일정 원문:{" "}
                        {getOfficialPoster(selected.id)?.scheduleRaw || "확인 불가"}
                      </p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"
                  onClick={() => {
                    const event = selected;
                    setSelected(null);
                    window.setTimeout(() => {
                      if (requireAuth()) setSavingEvent(event);
                    }, 220);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {plan.some((item) => item.id === `event:${selected.id}`) ? "방문일 변경" : "담기"}
                </button>
                {plan.some((item) => item.id === `event:${selected.id}`) && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void toggleSave(selected)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 py-3 font-bold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    담기 취소
                  </button>
                )}
                <TicketlinkBookingButton title={selected.title} className="w-full" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {savingEvent && (
        <VisitDateDialog
          event={{
            title: savingEvent.title,
            venue: savingEvent.venue || "장소 확인 불가",
            startDate: getOfficialSchedule(savingEvent.id).dates[0] ?? savingEvent.startDate,
            endDate:
              getOfficialSchedule(savingEvent.id).dates[
                getOfficialSchedule(savingEvent.id).dates.length - 1
              ] ?? null,
          }}
          open
          availableDates={
            getOfficialSchedule(savingEvent.id).dates.length
              ? getOfficialSchedule(savingEvent.id).dates
              : undefined
          }
          onOpenChange={(open) => {
            if (!open) setSavingEvent(null);
          }}
          initialDate={plan.find((item) => item.id === `event:${savingEvent.id}`)?.startDate}
          onConfirm={async (visitDate) => {
            if (pending) return;
            setPending(true);
            try {
              const ok = await addPlan({
                dateKind: getOfficialSchedule(savingEvent.id).dates.includes(visitDate)
                  ? "event"
                  : "personal",
                id: `event:${savingEvent.id}`,
                kind: "event",
                title: savingEvent.title,
                subtitle: getOfficialSchedule(savingEvent.id).dates.includes(visitDate)
                  ? `공식 포스터 개최일 ${visitDate} · ${savingEvent.venue || "장소 확인 불가"}`
                  : `개인 방문예정일 ${visitDate} · ${savingEvent.venue || "장소 확인 불가"} · 공식 개최일 아님`,
                startDate: visitDate,
                endDate: visitDate,
                venue: savingEvent.venue || "장소 확인 불가",
              });
              if (ok) {
                setSavingEvent(null);
                toast.success("선택한 방문일로 담았어요.");
              } else toast.error("저장하지 못했습니다. 다시 시도해 주세요.");
            } finally {
              setPending(false);
            }
          }}
        />
      )}
    </section>
  );
}
