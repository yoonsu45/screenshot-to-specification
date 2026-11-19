import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  MapPin,
  Plus,
  Route as RouteIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { verifyEvent, formatDate, formatRange, type VerifyStatus } from "@/lib/event-service";
import { ComparisonCard, ComparisonTable } from "@/components/app/ComparisonCard";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";
import { officialEvents } from "@/lib/official-data";
import { getOfficialPoster, getOfficialSchedule } from "@/lib/official-posters";
import { findTransitDestination } from "@/lib/transit-destination";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "The:Check" },
      { name: "description", content: "입력한 행사 정보와 공식 기록을 나란히 비교한 결과입니다." },
      { property: "og:title", content: "대조 결과 — 올팍 행사체크" },
      {
        property: "og:description",
        content: "입력한 행사 정보와 공식 기록을 나란히 비교한 결과입니다.",
      },
    ],
  }),
  component: ResultPage,
});

const statusMeta: Record<
  VerifyStatus,
  { label: string; desc: string; icon: typeof Info; cls: string }
> = {
  match: {
    label: "비교 자료와 일치",
    desc: "입력한 정보가 비교 자료와 같아요. 아래 출처를 확인해 주세요.",
    icon: CheckCircle2,
    cls: "bg-lime text-lime-foreground",
  },
  partial: {
    label: "게시물과 일부 다름",
    desc: "비교 자료와 다른 항목이 있어요. 아래에서 확인하세요.",
    icon: AlertTriangle,
    cls: "bg-warn text-warn-foreground",
  },
  "need-info": {
    label: "일부 항목 확인 불가",
    desc: "입력 또는 원본 자료가 부족해 확인할 수 없는 항목이 있어요.",
    icon: HelpCircle,
    cls: "bg-secondary text-secondary-foreground",
  },
  unverified: {
    label: "행사 확인 불가",
    desc: "보유 자료에서 정확히 일치하는 행사명을 찾지 못했어요. 허위라는 뜻은 아니에요.",
    icon: Info,
    cls: "bg-muted text-muted-foreground",
  },
};

function ResultPage() {
  const { draft, setAnchor, addPlan, plan, requireAuth } = useAppStore();
  const navigate = useNavigate();
  const [visitDateOpen, setVisitDateOpen] = useState(false);
  const result = useMemo(() => verifyEvent(draft), [draft]);
  const venueDiff = result.fields.find((f) => f.label === "장소")?.status === "different";
  const officialEvent = useMemo(() => {
    if (draft.officialRecordId) {
      return officialEvents.find((event) => event.id === draft.officialRecordId) ?? null;
    }
    const title = normalizeTitle(draft.title);
    const exactMatches = title
      ? officialEvents.filter((event) => normalizeTitle(event.title) === title)
      : [];
    return exactMatches.length === 1 ? exactMatches[0]! : null;
  }, [draft.officialRecordId, draft.title]);

  useEffect(() => {
    if (!draft.title) navigate({ to: "/check" });
  }, [draft.title, navigate]);
  const meta = statusMeta[result.status];
  const ev = result.event;
  const saveTarget = ev ?? officialEvent;
  const officialSchedule = officialEvent ? getOfficialSchedule(officialEvent.id) : null;
  const officialPoster = officialEvent ? getOfficialPoster(officialEvent.id) : undefined;
  const saveVenue = saveTarget?.venue || "장소 확인 불가";
  const transitDestination = findTransitDestination(saveTarget?.venue);
  const saveStartDate = officialEvent
    ? (officialSchedule?.dates[0] ?? officialEvent.startDate)
    : (ev?.startDate ?? null);
  const saveEndDate = officialEvent
    ? (officialSchedule?.dates[(officialSchedule?.dates.length ?? 0) - 1] ?? officialEvent.startDate)
    : (ev?.endDate ?? ev?.startDate ?? null);

  useEffect(() => {
    if (transitDestination) setAnchor(transitDestination.name);
  }, [transitDestination, setAnchor]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className="min-w-0 space-y-4">
        <h1 className="text-2xl font-black text-primary sm:text-3xl">대조 결과</h1>
        {draft.image && (
          <img
            src={draft.image}
            alt="입력한 캡처"
            className="max-h-64 w-full rounded-2xl border border-border bg-card object-contain"
          />
        )}
        <div className="rounded-2xl bg-card p-4 text-sm shadow-card">
          <p className="mb-2 font-bold text-muted-foreground">내가 입력한 정보</p>
          <p>
            <b>행사명</b> {draft.title}
          </p>
          <p>
            <b>날짜</b> {draft.date || "—"}
          </p>
          <p>
            <b>장소</b> {draft.venue || "—"}
          </p>
          <Link
            to="/check"
            className="mt-3 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          >
            다시 입력하기
          </Link>
        </div>
      </section>

      <section className="min-w-0 space-y-4">
        {draft.image && saveTarget && (
          <div className="rounded-2xl border border-primary/20 bg-secondary p-4">
            <h2 className="text-lg font-black text-primary">찾으시는 행사가 맞으신가요?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              행사명과 날짜, 장소를 확인한 뒤 방문 계획에 담아 주세요.
            </p>
          </div>
        )}
        {result.sourceType === "demo" && (
          <p role="note" className="rounded-xl bg-warn p-4 font-bold">
            시연용 예시 데이터와 비교한 결과입니다. 실제 행사나 공식 검증 결과가 아닙니다.
          </p>
        )}
        {result.sourceType === "official_public_data" && (
          <div className="rounded-xl bg-secondary p-4 text-sm">
            <p className="font-bold">출처: {result.sourceName}</p>
            {result.dateSource === "official_poster" && <p>개최일 출처: 공식 공연 포스터 정보</p>}
            {result.scheduleIssue && <p className="font-bold">{result.scheduleIssue}</p>}
            <p>
              수집한 공식 자료 기준이며 최신 일정 전체를 보장하지 않습니다. 개최일이 없으면 날짜는
              확인 불가로 표시합니다.
            </p>
            {result.ambiguous ? (
              <p>같은 이름의 자료가 여러 건 있어 회차를 확정할 수 없습니다.</p>
            ) : (
              <p>출처 자료 CSV 행: {result.sourceRows?.join(", ")}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 font-bold">
              {officialPoster && <a className="underline" href={officialPoster.imageUrl} target="_blank" rel="noopener noreferrer">비교한 공식 포스터 보기</a>}
              {result.sourceName === "한국체육산업개발 공연정보 Open API" && <a className="underline" href="https://www.data.go.kr/data/3037877/openapi.do" target="_blank" rel="noopener noreferrer">공식 공연정보 API 안내</a>}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${meta.cls}`}
          >
            <meta.icon className="h-4 w-4" /> {meta.label}
          </span>
          {venueDiff && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn px-3 py-1.5 text-sm font-bold text-warn-foreground">
              <MapPin className="h-4 w-4" /> 장소가 달라요
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{meta.desc}</p>
        {ev && (
          <p className="text-sm">
            시연용 예시: <b>{ev.title}</b> · {formatRange(ev)} ·{" "}
            <span className="rounded-md bg-lime px-1.5 font-bold text-lime-foreground">
              {ev.venue}
            </span>
          </p>
        )}

        <div className="space-y-3 lg:hidden">
          {result.fields.map((f) => (
            <ComparisonCard key={f.label} field={f} />
          ))}
        </div>
        <div className="hidden lg:block">
          <ComparisonTable fields={result.fields} />
        </div>

        {saveTarget && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  if (requireAuth()) setVisitDateOpen(true);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab"
              >
                <Plus className="h-4 w-4" />{" "}
                {plan.some((item) => item.id === `event:${saveTarget.id}`)
                  ? "방문일 변경"
                  : "담기"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {officialPoster ? (
                <a
                  href={officialPoster.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-3 text-center text-sm font-bold text-secondary-foreground"
                >
                  공식 공연 포스터 보기
                </a>
              ) : (
                <a
                  href="https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20301010000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center rounded-xl bg-secondary px-3 py-3 text-center text-sm font-bold text-secondary-foreground"
                >
                  공식 공연 일정 전체 보기
                  <span className="mt-1 text-xs font-normal text-muted-foreground">
                    {result.sourceType === "demo" ? "시연용 행사 · 공식 원문 없음" : "공연별 원문 링크 없음"}
                  </span>
                </a>
              )}
              {transitDestination ? <Link
                to="/directions"
                onClick={() => setAnchor(transitDestination.name)}
                className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-secondary-foreground"
              >
                <RouteIcon className="h-4 w-4" /> {transitDestination.name} 가는 길
              </Link> : <p className="flex items-center justify-center rounded-xl bg-secondary px-3 py-3 text-center text-sm text-muted-foreground">이 장소의 가는 길은 아직 제공하지 않아요</p>}
            </div>
          </>
        )}
        {!saveTarget && (
          <a
            href="https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20301010000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center rounded-xl bg-secondary px-3 py-3 text-center text-sm font-bold text-secondary-foreground"
          >
            공식 공연 일정 전체 보기
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              해당 공연을 확인하지 못했어요 · 직접 검색해 주세요
            </span>
          </a>
        )}
      </section>
      {saveTarget && (
        <VisitDateDialog
          event={{
            title: saveTarget.title,
            venue: saveVenue,
            startDate: saveStartDate,
            endDate: saveEndDate,
          }}
          open={visitDateOpen}
          onOpenChange={setVisitDateOpen}
          availableDates={officialSchedule?.dates.length ? officialSchedule.dates : undefined}
          initialDate={plan.find((item) => item.id === `event:${saveTarget.id}`)?.startDate}
          onConfirm={async (visitDate) => {
            const added = await addPlan({
              ...(officialSchedule?.dates.includes(visitDate)
                ? { dateKind: "event" as const }
                : {}),
              id: `event:${saveTarget.id}`,
              kind: "event",
              title: saveTarget.title,
              subtitle: `${formatDate(visitDate)} · ${saveVenue}`,
              startDate: visitDate,
              endDate: visitDate,
              venue: saveVenue,
            });
            if (!added) {
              toast.error("일정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
              return;
            }
            setVisitDateOpen(false);
            toast.success("선택한 날짜로 방문 계획에 담았어요");
          }}
        />
      )}
    </div>
  );
}

function normalizeTitle(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]/g, "");
}
