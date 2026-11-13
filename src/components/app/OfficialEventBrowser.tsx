import { useEffect, useState } from "react";
import { Bookmark, CalendarDays, MapPin, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";
import { getOfficialPoster, getOfficialSchedule } from "@/lib/official-posters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { searchOfficialEvents } from "@/lib/event-service";
import { getFacility } from "@/data/facilities";
import { officialRecordSource } from "@/lib/official-data";

const PAGE_SIZE = 20;

export function OfficialEventBrowser() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ReturnType<typeof searchOfficialEvents>[number] | null>(
    null,
  );
  const [savingEvent, setSavingEvent] = useState<
    ReturnType<typeof searchOfficialEvents>[number] | null
  >(null);
  const [pending, setPending] = useState(false);
  const { facilityId, setDraft, plan, addPlan, removePlan, requireAuth, eventSaveCounts } =
    useAppStore();
  async function toggleSave(event: ReturnType<typeof searchOfficialEvents>[number]) {
    if (pending || !requireAuth()) return;
    if (plan.some((item) => item.id === `event:${event.id}`)) {
      setPending(true);
      try {
        const ok = await removePlan(`event:${event.id}`);
        if (!ok) toast.error("저장 취소에 실패했습니다.");
      } finally {
        setPending(false);
      }
    } else setSavingEvent(event);
  }
  useEffect(() => {
    setPage(0);
  }, [facilityId]);
  const navigate = useNavigate();
  const matches = searchOfficialEvents(query)
    .filter((event) => {
      if (facilityId === "all") return true;
      if (facilityId === "olympic-park")
        return Boolean(
          event.venue &&
          /올림픽홀|KSPO\s?DOME|체조경기장|핸드볼경기장|뮤즈라이브|우리금융아트홀|K-아트홀|88잔디마당|평화의광장|소마미술관/.test(
            event.venue,
          ),
        );
      return event.venue === getFacility(facilityId)?.name;
    })
    .sort(
      (left, right) =>
        Number(Boolean(getOfficialPoster(right.id))) - Number(Boolean(getOfficialPoster(left.id))),
    );
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = matches.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <section className="space-y-5" aria-label="공식 공공데이터 행사 조회">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
          공식 행사 정보
        </h1>
        <span className="mt-3 block h-1.5 w-10 rounded-full bg-brand-orange" />
        <p className="mt-2 text-sm text-muted-foreground">
          공식 공연정보 API와 공연 포스터 파일데이터를 함께 제공합니다. 과거 기록을 포함하며,
          실시간으로 갱신되는 최신 일정은 아닙니다.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          선택한 시설의 행사 정보를 확인하세요. 개최일이 없는 자료는 날짜 확인 불가로 표시합니다.
          분류와 포스터가 제공되지 않은 자료는 임의로 채우지 않습니다.
        </p>
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
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
                onClick={() => setSelected(event)}
              >
                <OfficialPosterImage
                  eventId={event.id}
                  title={event.title}
                  className="h-28 w-32 shrink-0 rounded-[1.35rem] sm:h-32 sm:w-40"
                />
                <span className="min-w-0 flex-1 py-1">
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {officialRecordSource(event.id)}
                  </span>
                  <span className="mb-3 line-clamp-2 text-xl font-black leading-tight text-primary sm:text-2xl">
                    {event.title}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                    {getOfficialSchedule(event.id).raw
                      ? `${getOfficialSchedule(event.id).raw}${getOfficialSchedule(event.id).issue ? " · 확인 필요" : ""}`
                      : event.startDate || "날짜 확인 불가"}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    <span className="truncate">{event.venue || "장소 확인 불가"}</span>
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-brand-orange sm:text-sm">
                    <UsersRound className="h-4 w-4 shrink-0" />
                    {eventSaveCounts[event.id] === undefined
                      ? "담은 인원 확인 중"
                      : `${eventSaveCounts[event.id]!.toLocaleString("ko-KR")}명이 일정에 담았어요`}
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
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-primary hover:bg-secondary disabled:opacity-40"
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
        <nav aria-label="공식 자료 페이지" className="flex items-center justify-center gap-4">
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary">{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected ? officialRecordSource(selected.id) : "공식 행사 정보"}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <OfficialPosterImage
                key={selected.id}
                eventId={selected.id}
                title={selected.title}
                className="max-h-64 min-h-32 w-full rounded-xl"
              />
              <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
                <p>
                  개최일:{" "}
                  {getOfficialSchedule(selected.id).raw || selected.startDate || "확인 불가"}
                </p>
                {getOfficialSchedule(selected.id).raw && <p>개최일 출처: 공식 공연 포스터 정보</p>}
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
                    <p className="text-xs text-muted-foreground">
                      {getOfficialPoster(selected.id)?.matchMethod ===
                      "standalone_official_poster_record"
                        ? "API에 임의로 합치지 않은 공식 포스터 자료입니다. 회차는 원문을 확인해 주세요."
                        : "행사명·장소가 일치하는 유일 후보로 매칭했습니다. 회차는 원문을 함께 확인해 주세요."}
                    </p>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  출처 자료 CSV 행: {selected.sourceRows.join(", ")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {getOfficialSchedule(selected.id).dates.length
                  ? "과거 공식 공연 기록입니다. 확인된 개최일 중 방문일을 선택할 수 있습니다."
                  : "개최일이 미확인되거나 자료가 충돌하는 경우 선택한 날짜는 개인 방문예정일로 저장됩니다."}
              </p>
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
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"
                onClick={() => {
                  setDraft({
                    title: selected.title,
                    date: "",
                    venue: "",
                    officialRecordId: selected.id,
                  });
                  void navigate({ to: "/check" });
                }}
              >
                이 공식 자료와 비교하기
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      {savingEvent && (
        <VisitDateDialog
          event={{
            title: savingEvent.title,
            venue: savingEvent.venue || "장소 확인 불가",
            startDate: getOfficialSchedule(savingEvent.id).dates[0] ?? savingEvent.startDate,
            endDate: getOfficialSchedule(savingEvent.id).dates.at(-1) ?? null,
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
