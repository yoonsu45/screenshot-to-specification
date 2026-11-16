import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Search,
  WandSparkles,
} from "lucide-react";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { events, type ParkEvent } from "@/data/events";
import { useAppStore } from "@/lib/app-store";
import {
  extractEventFromImage,
  type BrowserOcrResult,
  type OcrConfidence,
} from "@/lib/ocr-event-extraction";
import { formatRange, matchesEventSearch, searchOfficialEvents } from "@/lib/event-service";
import { optimizeImage } from "@/lib/image-optimization";
import { officialRecordSource, type OfficialRecord } from "@/lib/official-data";
import { getOfficialPoster, getOfficialSchedule } from "@/lib/official-posters";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "The:Check" },
      {
        name: "description",
        content:
          "브라우저 OCR로 캡처 이미지의 행사 정보를 읽거나 공연명을 검색해 공식 일정과 대조하세요.",
      },
      { property: "og:title", content: "행사 정보 입력 — 올팍 행사체크" },
      {
        property: "og:description",
        content: "캡처 이미지에서 행사 정보를 읽고 공식 일정과 대조하세요.",
      },
    ],
  }),
  component: CheckPage,
});

type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing"; progress: number; label: string }
  | { status: "success"; result: BrowserOcrResult }
  | { status: "error"; message: string };

function CheckPage() {
  const { draft, setDraft } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(draft);
  const [error, setError] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [replacingImage, setReplacingImage] = useState(false);
  const [selectedOfficialEvent, setSelectedOfficialEvent] = useState<OfficialRecord | null>(null);
  const replacementFileRef = useRef<HTMLInputElement>(null);
  const analyzedImage = useRef<string | null>(null);
  const analysisRequestId = useRef(0);
  const isCaptureMode = Boolean(form.image);

  const suggestions = useMemo(() => {
    const query = form.title.trim();
    if (!query) return events.slice(0, 6);
    return events
      .filter((event) => matchesEventSearch(event.title, event.venue, query))
      .slice(0, 6);
  }, [form.title]);

  const officialSearchResults = useMemo(() => {
    if (!form.title.trim()) return [];
    const matches = searchOfficialEvents(form.title);
    const preferredByTitle = new Map<string, OfficialRecord>();
    matches.forEach((event) => {
      const previous = preferredByTitle.get(event.title);
      if (!previous || (!getOfficialPoster(previous.id) && getOfficialPoster(event.id))) {
        preferredByTitle.set(event.title, event);
      }
    });
    return [...preferredByTitle.values()]
      .sort(
        (left, right) =>
          Number(Boolean(getOfficialPoster(right.id))) -
          Number(Boolean(getOfficialPoster(left.id))),
      )
      .slice(0, 10);
  }, [form.title]);

  useEffect(() => {
    setForm(draft);
    setError(false);
    setSearchOpen(false);

    if (!draft.image) {
      analysisRequestId.current += 1;
      analyzedImage.current = null;
      setAnalysis({ status: "idle" });
      return;
    }

    if (analyzedImage.current === draft.image) return;
    analyzedImage.current = draft.image;
    void analyzeImage(draft.image);
  }, [draft]);

  async function analyzeImage(imageDataUrl: string) {
    const requestId = ++analysisRequestId.current;
    setAnalysis({ status: "analyzing", progress: 0, label: "OCR 엔진 준비 중" });
    try {
      const result = await extractEventFromImage(imageDataUrl, ({ progress, label }) => {
        if (requestId !== analysisRequestId.current) return;
        setAnalysis({ status: "analyzing", progress, label });
      });
      if (requestId !== analysisRequestId.current) return;
      setForm((current) => ({
        ...current,
        officialRecordId: undefined,
        title: result.title,
        date: result.date,
        venue: result.venue,
      }));
      setAnalysis({ status: "success", result });
    } catch (caught) {
      if (requestId !== analysisRequestId.current) return;
      const message = caught instanceof Error ? caught.message : "이미지의 글자를 읽지 못했어요.";
      setAnalysis({ status: "error", message });
    }
  }

  async function replaceImage(file?: File) {
    if (!file) return;
    analysisRequestId.current += 1;
    setReplacingImage(true);
    setAnalysis({ status: "analyzing", progress: 0, label: "새 이미지 준비 중" });

    try {
      const image = await optimizeImage(file);
      analyzedImage.current = null;
      setDraft({ title: "", date: "", venue: "", image });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "이미지를 불러오지 못했어요.";
      setAnalysis({ status: "error", message });
    } finally {
      setReplacingImage(false);
      if (replacementFileRef.current) replacementFileRef.current.value = "";
    }
  }

  function selectEvent(event: ParkEvent) {
    setForm((current) => ({
      ...current,
      officialRecordId: undefined,
      title: event.title,
      date: event.startDate,
      venue: event.venue,
    }));
    setSearchOpen(false);
    setError(false);
  }

  function selectOcrCandidate(candidate: BrowserOcrResult["candidates"][number]) {
    if (candidate.sourceType === "demo") {
      const event = events.find((item) => item.id === candidate.eventId);
      if (event) selectEvent(event);
      return;
    }

    setForm((current) => ({
      ...current,
      officialRecordId: candidate.eventId,
      title: candidate.title,
      date: candidate.date || current.date,
      venue: candidate.venue || current.venue,
    }));
    setSearchOpen(false);
    setError(false);
  }

  function selectOfficialRecord(event: OfficialRecord) {
    const schedule = getOfficialSchedule(event.id);
    setForm((current) => ({
      ...current,
      officialRecordId: event.id,
      title: event.title,
      date: event.startDate || (schedule.dates.length === 1 ? schedule.dates[0]! : current.date),
      venue: event.venue || current.venue,
    }));
    setSelectedOfficialEvent(null);
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

  const field =
    "h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:ring-2 focus:ring-ring";
  const ocrResult = analysis.status === "success" ? analysis.result : null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-black text-primary sm:text-3xl">
        {isCaptureMode ? "캡처 이미지 글자 읽기" : "공연 직접 입력 · 검색"}
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {isCaptureMode
          ? "기기에서 읽은 행사 정보를 확인하고, 잘못된 부분만 직접 수정해 주세요."
          : "공연명을 검색해 등록된 행사를 선택하거나 정보를 직접 입력해 주세요."}
      </p>
      {form.officialRecordId && (
        <p className="mb-5 rounded-xl bg-secondary p-4 text-sm">
          목록에서 선택한 공식 자료와 비교합니다. 날짜·장소는 포스터에 적힌 내용을 직접 입력해
          주세요. 원본 자료에 없는 항목은 확인 불가로 처리합니다.
        </p>
      )}

      {form.image && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <img
            src={form.image}
            alt="선택한 캡처 이미지"
            className="max-h-72 w-full object-contain"
          />
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => replacementFileRef.current?.click()}
              disabled={replacingImage}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-extrabold text-primary transition hover:ring-2 hover:ring-ring disabled:cursor-wait disabled:opacity-60"
            >
              {replacingImage ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {replacingImage ? "새 이미지 준비 중" : "다른 사진 선택"}
            </button>
            <input
              ref={replacementFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="다른 사진 선택"
              onChange={(event) => void replaceImage(event.target.files?.[0])}
            />
          </div>
        </div>
      )}

      {form.image && (
        <AnalysisBanner state={analysis} onRetry={() => form.image && analyzeImage(form.image)} />
      )}

      {ocrResult && ocrResult.candidates.length > 0 && (
        <section className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-extrabold text-primary">인식된 행사 후보</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            포스터 글자와 공식 행사 자료를 비교한 결과예요. 일치하는 행사만 선택해 주세요.
          </p>
          <div className="mt-3 space-y-2">
            {ocrResult.candidates.map((candidate) => {
              return (
                <button
                  key={candidate.eventId}
                  type="button"
                  onClick={() => selectOcrCandidate(candidate)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-3 text-left transition hover:ring-2 hover:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold text-primary">
                      {candidate.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {candidate.sourceType === "official_public_data" ? "공식 행사" : "시연용"}
                      {candidate.venue ? ` · ${candidate.venue}` : ""}
                      {candidate.date ? ` · ${candidate.date}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {Math.round(candidate.score * 100)}%
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {ocrResult && ocrResult.titleSuggestions.length > 0 && (
        <section className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-extrabold text-primary">읽힌 행사명 후보</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            설명문은 제외했어요. 실제 행사명과 가장 가까운 문구를 눌러 선택해 주세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ocrResult.titleSuggestions.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, title, officialRecordId: undefined }));
                  setError(false);
                }}
                className={`rounded-full border px-3 py-2 text-left text-sm font-bold transition ${
                  form.title === title
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-primary hover:ring-2 hover:ring-ring"
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </section>
      )}

      {ocrResult && ocrResult.bookingDates.length > 0 && (
        <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-extrabold">예매 관련 날짜는 행사일과 분리했어요</p>
          <p className="mt-1 text-xs">{ocrResult.bookingDates.join(" · ")}</p>
        </div>
      )}

      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-card">
        <label className="relative block">
          <span className="mb-1.5 block text-sm font-bold">
            {isCaptureMode ? "행사명" : "공연명 검색"} <span className="text-destructive">*</span>
          </span>
          <span className="relative block">
            {!isCaptureMode && (
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            )}
            <input
              className={`${field} ${!isCaptureMode ? "pl-11" : ""}`}
              value={form.title}
              onFocus={() => !isCaptureMode && setSearchOpen(true)}
              onBlur={() => !isCaptureMode && window.setTimeout(() => setSearchOpen(false), 100)}
              onChange={(event) => {
                setForm({ ...form, title: event.target.value, officialRecordId: undefined });
                setError(false);
                setSearchOpen(true);
              }}
              placeholder={
                isCaptureMode ? "읽지 못한 경우 직접 입력해 주세요" : "공식 행사명 또는 장소 검색"
              }
              autoComplete="off"
            />
          </span>
          {error && (
            <span className="mt-1 block text-sm text-destructive">행사명을 입력해 주세요.</span>
          )}

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
                <p className="px-4 py-4 text-sm text-muted-foreground">
                  등록된 행사 중 검색 결과가 없어요. 그대로 직접 입력할 수 있어요.
                </p>
              )}
            </div>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">
            행사 날짜 <span className="font-normal text-muted-foreground">(선택)</span>
          </span>
          <input
            type="date"
            className={field}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">
            장소 <span className="font-normal text-muted-foreground">(선택)</span>
          </span>
          <input
            className={field}
            value={form.venue}
            onChange={(event) => setForm({ ...form, venue: event.target.value })}
            placeholder="예: KSPO DOME"
          />
        </label>
      </div>

      {form.title.trim() && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-extrabold text-primary">관련 공식 포스터</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            검색한 행사와 일치하는 공식 자료를 눌러 포스터와 상세 정보를 확인하세요.
          </p>
          {officialSearchResults.length > 0 ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {officialSearchResults.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOfficialEvent(event)}
                    className="flex h-full w-full items-center gap-3 rounded-xl bg-secondary p-3 text-left transition hover:ring-2 hover:ring-ring"
                  >
                    <OfficialPosterImage
                      eventId={event.id}
                      title={event.title}
                      className="h-24 w-20 shrink-0 rounded-lg"
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 block font-extrabold text-primary">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {event.venue || "장소 확인 불가"}
                      </span>
                      <span className="mt-2 block text-xs font-bold text-brand-orange">
                        {getOfficialPoster(event.id) ? "포스터 보기" : "행사 정보 보기"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
              일치하는 공식 포스터 자료가 없어요. 행사명은 그대로 직접 입력할 수 있습니다.
            </p>
          )}
        </section>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={submit}
          className="h-13 w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab"
        >
          출처를 구분해 비교하기
        </button>
      </div>

      <Dialog
        open={Boolean(selectedOfficialEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedOfficialEvent(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-2xl p-0 sm:max-h-[90dvh] sm:w-full">
          <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 pt-12 sm:max-h-[90dvh] sm:p-6 sm:pt-10">
            <DialogHeader>
              <DialogTitle className="pr-6 text-primary">
                {selectedOfficialEvent?.title}
              </DialogTitle>
              <DialogDescription>
                {selectedOfficialEvent
                  ? officialRecordSource(selectedOfficialEvent.id)
                  : "공식 행사 정보"}
              </DialogDescription>
            </DialogHeader>
            {selectedOfficialEvent && (
              <div className="mt-4 space-y-4">
                <OfficialPosterImage
                  key={selectedOfficialEvent.id}
                  eventId={selectedOfficialEvent.id}
                  title={selectedOfficialEvent.title}
                  className="max-h-[55dvh] min-h-48 w-full rounded-xl"
                />
                <div className="space-y-1 rounded-xl bg-secondary p-4 text-sm">
                  <p>
                    날짜:{" "}
                    {getOfficialSchedule(selectedOfficialEvent.id).raw ||
                      selectedOfficialEvent.startDate ||
                      "확인 불가"}
                  </p>
                  <p>장소: {selectedOfficialEvent.venue || "확인 불가"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => selectOfficialRecord(selectedOfficialEvent)}
                  className="w-full rounded-xl bg-primary px-4 py-3 font-extrabold text-primary-foreground"
                >
                  이 행사 선택
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalysisBanner({ state, onRetry }: { state: AnalysisState; onRetry: () => void }) {
  if (state.status === "analyzing") {
    return (
      <div className="mb-5 rounded-2xl bg-secondary px-4 py-3 text-primary">
        <div className="flex items-center gap-3">
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">{state.label}</p>
            <p className="text-xs text-muted-foreground">
              이미지는 서버로 전송되지 않아요 · {state.progress}%
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (state.status === "success") {
    const hasConfirmedField = Boolean(
      state.result.title ||
      state.result.date ||
      state.result.venue ||
      state.result.candidates.length,
    );

    if (!hasConfirmedField) {
      return (
        <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-extrabold">행사 정보를 확정하지 못했어요</p>
              <p className="mt-0.5 text-xs leading-5">
                관련 없는 후보는 표시하지 않았어요. 글자가 크게 보이도록 이미지를 잘라 다시
                시도하거나 행사명을 직접 입력해 주세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-extrabold"
          >
            <WandSparkles className="h-4 w-4" /> 다시 읽기
          </button>
        </div>
      );
    }

    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-extrabold">기기에서 포스터 글자를 읽었어요</p>
          <p className="text-xs">
            인식 신뢰도 {confidenceText(state.result.confidence)} · 빈칸과 후보를 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-extrabold">자동으로 글자를 읽지 못했어요</p>
            <p className="mt-0.5 text-xs leading-5">{state.message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-extrabold"
        >
          <WandSparkles className="h-4 w-4" /> 다시 읽기
        </button>
      </div>
    );
  }

  return null;
}

function confidenceText(confidence: OcrConfidence) {
  if (confidence === "high") return "높음";
  if (confidence === "medium") return "보통";
  return "낮음";
}
