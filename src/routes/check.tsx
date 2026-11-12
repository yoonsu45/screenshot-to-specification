import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, LoaderCircle, MapPin, Search, Sparkles, WandSparkles } from "lucide-react";
import { events, type ParkEvent } from "@/data/events";
import { useAppStore } from "@/lib/app-store";
import { extractEventFromImage, type ExtractedEventInfo } from "@/lib/ai-event-extraction";
import { EXAMPLE_CASE, formatRange } from "@/lib/event-service";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "행사 정보 입력 — 올팍 행사체크" },
      { name: "description", content: "캡처 이미지에서 행사 정보를 추출하거나 공연명을 검색해 공식 일정과 대조하세요." },
      { property: "og:title", content: "행사 정보 입력 — 올팍 행사체크" },
      { property: "og:description", content: "캡처 이미지에서 행사 정보를 추출하거나 공연명을 검색해 공식 일정과 대조하세요." },
    ],
  }),
  component: CheckPage,
});

type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "success"; confidence: ExtractedEventInfo["confidence"] }
  | { status: "error"; message: string };

function CheckPage() {
  const { draft, setDraft } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(draft);
  const [error, setError] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [searchOpen, setSearchOpen] = useState(false);
  const analyzedImage = useRef<string | null>(null);
  const isCaptureMode = Boolean(form.image);

  const suggestions = useMemo(() => {
    const query = form.title.trim().toLocaleLowerCase("ko-KR");
    if (!query) return events.slice(0, 6);
    return events.filter((event) =>
      event.title.toLocaleLowerCase("ko-KR").includes(query)
      || event.venue.toLocaleLowerCase("ko-KR").includes(query),
    ).slice(0, 6);
  }, [form.title]);

  useEffect(() => {
    setForm(draft);
    setError(false);
    setSearchOpen(false);

    if (!draft.image) {
      analyzedImage.current = null;
      setAnalysis({ status: "idle" });
      return;
    }

    if (analyzedImage.current === draft.image) return;
    analyzedImage.current = draft.image;
    void analyzeImage(draft.image);
  }, [draft]);

  async function analyzeImage(imageDataUrl: string) {
    setAnalysis({ status: "analyzing" });
    try {
      const extracted = await extractEventFromImage({ data: { imageDataUrl } });
      setForm((current) => ({
        ...current,
        title: extracted.title || current.title,
        date: extracted.date || current.date,
        venue: extracted.venue || current.venue,
      }));
      setAnalysis({ status: "success", confidence: extracted.confidence });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "이미지 분석에 실패했어요.";
      setAnalysis({ status: "error", message });
    }
  }

  function selectEvent(event: ParkEvent) {
    setForm((current) => ({
      ...current,
      title: event.title,
      date: event.startDate,
      venue: event.venue,
    }));
    setSearchOpen(false);
    setError(false);
  }

  function submit() {
    if (!form.title.trim()) {
      setError(true);
      return;
    }
    setDraft(form);
    navigate({ to: "/result" });
  }

  const field = "h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-black text-primary sm:text-3xl">
        {isCaptureMode ? "캡처 이미지 AI 분석" : "공연 직접 입력 · 검색"}
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {isCaptureMode
          ? "AI가 추출한 행사 정보를 확인하고 필요한 부분만 수정해 주세요."
          : "공연명을 검색해 등록된 행사를 선택하거나 정보를 직접 입력해 주세요."}
      </p>

      {form.image && (
        <img src={form.image} alt="선택한 캡처 이미지" className="mb-4 max-h-72 w-full rounded-2xl border border-border bg-card object-contain" />
      )}

      {form.image && (
        <AnalysisBanner
          state={analysis}
          onRetry={() => form.image && analyzeImage(form.image)}
        />
      )}

      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-card">
        <label className="relative block">
          <span className="mb-1.5 block text-sm font-bold">
            {isCaptureMode ? "행사명" : "공연명 검색"} <span className="text-destructive">*</span>
          </span>
          <span className="relative block">
            {!isCaptureMode && <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />}
            <input
              className={`${field} ${!isCaptureMode ? "pl-11" : ""}`}
              value={form.title}
              onFocus={() => !isCaptureMode && setSearchOpen(true)}
              onBlur={() => !isCaptureMode && window.setTimeout(() => setSearchOpen(false), 100)}
              onChange={(event) => {
                setForm({ ...form, title: event.target.value });
                setError(false);
                setSearchOpen(true);
              }}
              placeholder={isCaptureMode ? "이미지에서 추출한 행사명" : "예: CRAVITY CONCERT"}
              autoComplete="off"
            />
          </span>
          {error && <span className="mt-1 block text-sm text-destructive">행사명을 입력해 주세요.</span>}

          {!isCaptureMode && searchOpen && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {suggestions.length ? (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {suggestions.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
                        onClick={() => selectEvent(event)}
                        className="w-full px-4 py-3 text-left transition hover:bg-secondary"
                      >
                        <span className="block font-extrabold text-primary">{event.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {event.venue} · {formatRange(event)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-sm text-muted-foreground">등록된 행사 중 검색 결과가 없어요. 그대로 직접 입력할 수 있어요.</p>
              )}
            </div>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">날짜 <span className="font-normal text-muted-foreground">(선택)</span></span>
          <input type="date" className={field} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">장소 <span className="font-normal text-muted-foreground">(선택)</span></span>
          <input className={field} value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} placeholder="예: KSPO DOME" />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={submit} className="h-13 flex-1 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab">
          공식 일정과 대조하기
        </button>
        <button
          type="button"
          onClick={() => {
            setForm({ ...EXAMPLE_CASE, image: form.image });
            setError(false);
            setSearchOpen(false);
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3.5 font-bold text-primary"
        >
          <Sparkles className="h-4 w-4" /> 예시로 체험하기
        </button>
      </div>
    </div>
  );
}

function AnalysisBanner({ state, onRetry }: { state: AnalysisState; onRetry: () => void }) {
  if (state.status === "analyzing") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-primary">
        <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
        <div><p className="font-extrabold">AI가 캡처를 읽고 있어요</p><p className="text-xs text-muted-foreground">행사명, 날짜, 장소를 찾는 중입니다.</p></div>
      </div>
    );
  }

  if (state.status === "success") {
    const confidenceLabel = state.confidence === "high" ? "높음" : state.confidence === "medium" ? "보통" : "낮음";
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div><p className="font-extrabold">행사 정보를 추출했어요</p><p className="text-xs">인식 신뢰도 {confidenceLabel} · 아래 내용을 확인해 주세요.</p></div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
        <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">자동 분석을 완료하지 못했어요</p><p className="mt-0.5 text-xs leading-5">{state.message}</p></div></div>
        <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-extrabold">
          <WandSparkles className="h-4 w-4" /> 다시 분석하기
        </button>
      </div>
    );
  }

  return null;
}
