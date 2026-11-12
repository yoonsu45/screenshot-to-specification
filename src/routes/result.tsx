import { useEffect, useMemo } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Info, MapPin, Plus, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { verifyEvent, formatRange, type VerifyStatus } from "@/lib/event-service";
import { ComparisonCard, ComparisonTable } from "@/components/app/ComparisonCard";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "대조 결과 — 올팍 행사체크" },
      { name: "description", content: "입력한 행사 정보와 공식 기록을 나란히 비교한 결과입니다." },
      { property: "og:title", content: "대조 결과 — 올팍 행사체크" },
      { property: "og:description", content: "입력한 행사 정보와 공식 기록을 나란히 비교한 결과입니다." },
    ],
  }),
  component: ResultPage,
});

const statusMeta: Record<VerifyStatus, { label: string; desc: string; icon: typeof Info; cls: string }> = {
  match: { label: "공식 일정과 일치", desc: "입력한 정보가 공식 기록과 같아요.", icon: CheckCircle2, cls: "bg-lime text-lime-foreground" },
  partial: { label: "게시물과 일부 다름", desc: "공식 기록과 다른 항목이 있어요. 아래에서 확인하세요.", icon: AlertTriangle, cls: "bg-warn text-warn-foreground" },
  "need-info": { label: "정보 더 필요", desc: "행사는 찾았지만 날짜나 장소를 더 입력하면 정확히 대조할 수 있어요.", icon: HelpCircle, cls: "bg-secondary text-secondary-foreground" },
  unverified: { label: "공식 일정에서 미확인", desc: "현재 연결된 공식 일정에서는 이 행사를 찾지 못했어요. 공식 채널에서 한 번 더 확인해 주세요.", icon: Info, cls: "bg-muted text-muted-foreground" },
};

function ResultPage() {
  const { draft, setAnchor, addPlan } = useAppStore();
  const navigate = useNavigate();
  const result = useMemo(() => verifyEvent(draft), [draft]);
  const venueDiff = result.fields.find((f) => f.label === "장소")?.status === "different";

  useEffect(() => {
    if (!draft.title) navigate({ to: "/check" });
  }, [draft.title, navigate]);
  useEffect(() => {
    if (result.event) setAnchor(result.event.venue);
  }, [result.event, setAnchor]);

  const meta = statusMeta[result.status];
  const ev = result.event;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className="min-w-0 space-y-4">
        <h1 className="text-2xl font-black text-primary sm:text-3xl">대조 결과</h1>
        {draft.image && <img src={draft.image} alt="입력한 캡처" className="max-h-64 w-full rounded-2xl border border-border bg-card object-contain" />}
        <div className="rounded-2xl bg-card p-4 text-sm shadow-card">
          <p className="mb-2 font-bold text-muted-foreground">내가 입력한 정보</p>
          <p><b>행사명</b> {draft.title}</p>
          <p><b>날짜</b> {draft.date || "—"}</p>
          <p><b>장소</b> {draft.venue || "—"}</p>
          <Link to="/check" className="mt-3 inline-block font-semibold text-primary underline-offset-4 hover:underline">다시 입력하기</Link>
        </div>
      </section>

      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${meta.cls}`}>
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
            공식 기록: <b>{ev.title}</b> · {formatRange(ev)} · <span className="rounded-md bg-lime px-1.5 font-bold text-lime-foreground">{ev.venue}</span>
          </p>
        )}

        <div className="space-y-3 lg:hidden">
          {result.fields.map((f) => <ComparisonCard key={f.label} field={f} />)}
        </div>
        <div className="hidden lg:block">
          <ComparisonTable fields={result.fields} />
        </div>

        {ev && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={ev.officialUrl ?? "https://www.ksponco.or.kr/olympicpark/"} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-card py-3.5 font-bold text-primary">
                <ExternalLink className="h-4 w-4" /> 공식 상세 보기
              </a>
              <button
                onClick={() => {
                  addPlan({
                    id: `event:${ev.id}`,
                    kind: "event",
                    title: ev.title,
                    subtitle: `${formatRange(ev)} · ${ev.venue}`,
                    startDate: ev.startDate,
                    endDate: ev.endDate,
                    venue: ev.venue,
                  });
                  toast.success("방문 계획에 담았어요");
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab"
              >
                <Plus className="h-4 w-4" /> 방문 계획에 담기
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/nearby" className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-secondary-foreground"><MapPin className="h-4 w-4" /> {ev.venue} 주변</Link>
              <Link to="/directions" className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-secondary-foreground"><RouteIcon className="h-4 w-4" /> {ev.venue} 가는 길</Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
