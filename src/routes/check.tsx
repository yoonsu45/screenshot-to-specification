import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Search,
  WandSparkles,
} from "lucide-react";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import { OfficialEventSaveButton } from "@/components/app/OfficialEventSaveButton";
import { FacilityPicker, type PickerItem } from "@/components/app/FacilityPicker";
import { EventCard } from "@/components/app/EventCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { events, type ParkEvent } from "@/data/events";
import { internalVenueProfiles } from "@/data/internal-facilities";
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

const venueOptions: readonly PickerItem[] = [
  { id: "", name: "선택하지 않음" },
  ...internalVenueProfiles.map((venue) => ({
    id: venue.name,
    name: venue.name,
    keywords: venue.aliases,
  })),
];

function CheckPage() {
  const { draft, setDraft } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(draft);
  const [error, setError] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [replacingImage, setReplacingImage] = useState(false);
  const [selectedOfficialEvent, setSelectedOfficialEvent] = useState<OfficialRecord | null>(null);
  const replacementFileRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLElement>(null);
  const analyzedImage = useRef<string | null>(null);
  const analysisRequestId = useRef(0);
  const isCaptureMode = Boolean(form.image);
  const officialSearchQuery = manualSearchQuery;

  const suggestions = useMemo(() => {
    const query = form.title.trim();
    if (!query) return events.slice(0, 6);
    return events
      .filter((event) => matchesEventSearch(event.title, event.venue, query))
      .slice(0, 6);
  }, [form.title]);

  const officialSearchResults = useMemo(() => {
    if (!officialSearchQuery) return [];
    const matches = searchOfficialEvents(officialSearchQuery);
    return [...matches]
      .sort(
        (left, right) =>
          Number(Boolean(getOfficialPoster(right.id))) -
          Number(Boolean(getOfficialPoster(left.id))),
      )
      .slice(0, 10);
  }, [officialSearchQuery]);

  const demoSearchResults = useMemo(() => {
    if (isCaptureMode || !manualSearchQuery) return [];
    return events
      .filter((event) => matchesEventSearch(event.title, event.venue, manualSearchQuery))
      .slice(0, 10);
  }, [isCaptureMode, manualSearchQuery]);

  useEffect(() => {
    setForm(draft);
    setError(false);
    setSearchOpen(false);
    setManualSearchQuery("");

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
        endDate: result.detectedRanges.length === 1 && result.detectedDates.length === 2 ? result.detectedRanges[0]!.end : "",
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
      endDate: event.endDate ?? "",
      venue: event.venue,
    }));
    setSearchOpen(false);
    setManualSearchQuery(event.title);
    setError(false);
  }

  function runManualSearch() {
    const query = form.title.trim();
    if (!query) {
      setError(true);
      return;
    }
    setManualSearchQuery(query);
    setSearchOpen(false);
    setError(false);
    window.requestAnimationFrame(() => {
      searchResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetDate(field: "date" | "endDate") {
    setForm((current) => ({ ...current, [field]: "" }));
    setError(false);
  }

  function resetEntry() {
    const emptyForm = {
      title: "",
      date: "",
      endDate: "",
      venue: "",
      ...(form.image ? { image: form.image } : {}),
    };
    setForm(emptyForm);
    setDraft(emptyForm);
    setManualSearchQuery("");
    setSearchOpen(false);
    setSelectedOfficialEvent(null);
    setVenuePickerOpen(false);
    setError(false);
  }

  function selectOcrCandidate(candidate: BrowserOcrResult["candidates"][number]) {
    setForm((current) => ({
      ...current,
      officialRecordId: candidate.eventId,
    }));
    setSearchOpen(false);
    setError(false);
  }

  function selectOfficialRecord(event: OfficialRecord) {
    const schedule = getOfficialSchedule(event.id);
    setForm((current) => ({
      ...current,
      officialRecordId: event.id,
      ...(isCaptureMode ? {} : {
        title: event.title,
        date: event.startDate || (schedule.dates.length === 1 ? schedule.dates[0]! : current.date),
        endDate: "",
        venue: event.venue || current.venue,
      }),
    }));
    setSelectedOfficialEvent(null);
    setSearchOpen(false);
    setError(false);
  }

  const field =
    "h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:ring-2 focus:ring-ring";
  const dateField = `${field} event-date-input block min-w-0 max-w-full`;
  const ocrResult = analysis.status === "success" ? analysis.result : null;
  const selectedComparison = form.officialRecordId
    ? [...searchOfficialEvents(""), ...events].find((event) => event.id === form.officialRecordId)
    : undefined;

  function compare() {
    if (!form.title.trim()) { setError(true); return; }
    if (form.endDate && (!form.date || form.endDate < form.date)) { setError(true); return; }
    setDraft(form);
    void navigate({ to: "/result" });
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-primary sm:text-3xl">
          {isCaptureMode ? "캡처 이미지 글자 읽기" : "공연 직접 입력 · 검색"}
        </h1>
        {(form.title || form.date || form.endDate || form.venue || manualSearchQuery) && (
            <button
              type="button"
              onClick={resetEntry}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-extrabold text-primary hover:bg-secondary"
            >
              <RotateCcw className="h-4 w-4" />
              입력 초기화
            </button>
          )}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {isCaptureMode
          ? "기기에서 읽은 행사 정보를 확인하고, 잘못된 부분만 직접 수정해 주세요."
          : "공연명을 검색해 등록된 행사를 선택하거나 정보를 직접 입력해 주세요."}
      </p>
      {form.officialRecordId && (
        <div className="mb-5 rounded-xl bg-secondary p-4 text-sm">
          비교할 행사: <b>{selectedComparison?.title ?? "선택한 자료"}</b>. 입력한 캡처 내용은 그대로 유지됩니다.
          <button type="button" onClick={() => setForm((current) => ({ ...current, officialRecordId: undefined }))} className="ml-2 font-bold text-primary underline">선택 해제</button>
        </div>
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

      {ocrResult && ocrResult.bookingDates.length > 0 && (
        <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-extrabold">예매 관련 날짜는 행사일과 분리했어요</p>
          <p className="mt-1 text-xs">{ocrResult.bookingDates.join(" · ")}</p>
        </div>
      )}

      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="relative block">
          <label htmlFor="event-title-search" className="mb-1.5 block text-sm font-bold">
            {isCaptureMode ? "행사명" : "공연명 검색"} <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-2">
            <span className="relative min-w-0 flex-1">
              {!isCaptureMode && (
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              )}
              <input
                id="event-title-search"
                className={`${field} ${!isCaptureMode ? "pl-11" : ""}`}
                value={form.title}
                onFocus={() => !isCaptureMode && setSearchOpen(true)}
                onBlur={() => !isCaptureMode && window.setTimeout(() => setSearchOpen(false), 100)}
                onChange={(event) => {
                  setForm({ ...form, title: event.target.value });
                  setManualSearchQuery("");
                  setError(false);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (!isCaptureMode && event.key === "Enter") {
                    event.preventDefault();
                    runManualSearch();
                  }
                }}
                placeholder={
                  isCaptureMode ? "읽지 못한 경우 직접 입력해 주세요" : "공식 행사명 또는 장소 검색"
                }
                autoComplete="off"
              />
            </span>
            {!isCaptureMode && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={runManualSearch}
                className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground"
              >
                <Search className="h-4 w-4" /> 검색
              </button>
            )}
          </div>
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
        </div>

        <div className="block">
          <div className="mb-1.5 flex min-h-8 items-center justify-between gap-2">
            <label htmlFor="event-start-date" className="text-sm font-bold">
              행사 시작일 <span className="font-normal text-muted-foreground">(선택)</span>
            </label>
            {form.date && (
              <button
                type="button"
                onClick={() => resetDate("date")}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 시작일 초기화
              </button>
            )}
          </div>
          <input
            id="event-start-date"
            type="date"
            className={dateField}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </div>
        <div className="block">
          <div className="mb-1.5 flex min-h-8 items-center justify-between gap-2">
            <label htmlFor="event-end-date" className="text-sm font-bold">
              행사 종료일 <span className="font-normal text-muted-foreground">(기간 행사일 때 입력)</span>
            </label>
            {form.endDate && (
              <button
                type="button"
                onClick={() => resetDate("endDate")}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 종료일 초기화
              </button>
            )}
          </div>
          <input id="event-end-date" type="date" className={dateField} value={form.endDate ?? ""} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
        </div>
        {form.endDate && (!form.date || form.endDate < form.date) && <p role="alert" className="text-sm font-bold text-destructive">종료일은 시작일 이후로 입력해 주세요.</p>}
        {ocrResult && ocrResult.detectedDates.length > 1 && (
          <div>
            {ocrResult.detectedRanges.map((range) => (
              <p key={`${range.start}-${range.end}`} className="mb-2 text-sm font-bold text-primary">
                인식된 행사 기간: {range.start} ~ {range.end}
              </p>
            ))}
            <p className="mb-2 text-xs text-muted-foreground">날짜를 확인하고 시작일과 종료일을 수정해 주세요. 아래 날짜를 누르면 시작일에 입력됩니다.</p>
            <div className="flex flex-wrap gap-2">
              {ocrResult.detectedDates.map((date) => (
                <button key={date} type="button" aria-pressed={form.date === date} onClick={() => setForm({ ...form, date })} className={`rounded-full border px-3 py-2 text-sm font-bold ${form.date === date ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-primary"}`}>
                  {date}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="block">
          <label htmlFor="event-venue" className="mb-1.5 block text-sm font-bold">
            장소 <span className="font-normal text-muted-foreground">(선택)</span>
          </label>
          <input id="event-venue" className={field} value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} placeholder="캡처에 적힌 장소를 입력해 주세요" />
          <button
            type="button"
            onClick={() => setVenuePickerOpen(true)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary underline"
          >
            <MapPin className="h-4 w-4" /> 올림픽공원 장소에서 선택
          </button>
        </div>
      </div>

      {ocrResult && ocrResult.candidates.length > 0 && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-extrabold text-primary">인식된 행사 후보</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            포스터 글자와 공식 행사 자료를 비교한 결과예요. 일치하는 행사만 선택해 주세요.
          </p>
          <div className="mt-3 space-y-2">
            {ocrResult.candidates.map((candidate) => {
              const selected = form.officialRecordId === candidate.eventId;
              return (
                <button
                  key={candidate.eventId}
                  type="button"
                  onClick={() => selectOcrCandidate(candidate)}
                  aria-pressed={selected}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-secondary hover:border-primary/40"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-background px-2 py-1 text-xs font-bold text-primary">
                      {candidate.sourceType === "official_public_data" ? "공식 자료" : "시연용"}
                    </span>
                    {selected && (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> 선택됨
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block break-words font-extrabold leading-6 text-primary">
                    {candidate.title}
                  </span>
                  <span className="mt-1 block break-words text-xs leading-5 text-muted-foreground">
                    {candidate.date || "날짜 확인 불가"} · {candidate.venue || "장소 확인 불가"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!isCaptureMode && officialSearchQuery && (
        <section
          ref={searchResultsRef}
          className="mt-5 scroll-mt-4 rounded-2xl border border-border bg-card p-4 shadow-card"
        >
          <h2 className="font-extrabold text-primary">검색 결과</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            행사 정보를 확인하고 맞는 행사를 바로 방문 계획에 담아 보세요.
          </p>
          {demoSearchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-extrabold text-primary">등록된 행사</h3>
              <ul className="grid gap-3">
                {demoSearchResults.map((event) => (
                  <li key={event.id} className="min-w-0">
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {officialSearchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-extrabold text-primary">공식 행사</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {officialSearchResults.map((event) => (
                  <li key={event.id}>
                    <article className="flex h-full flex-col rounded-xl bg-secondary p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOfficialEvent(event)}
                        className="flex flex-1 items-center gap-3 text-left transition hover:opacity-80"
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
                          <span className="mt-1 block text-xs text-muted-foreground">{getOfficialSchedule(event.id).raw || event.startDate || "날짜 확인 불가"}</span>
                          <span className="mt-2 block text-xs font-bold text-brand-orange">
                            {getOfficialPoster(event.id) ? "포스터 보기" : "행사 정보 보기"}
                          </span>
                        </span>
                      </button>
                      <OfficialEventSaveButton event={event} className="mt-3 w-full" />
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {demoSearchResults.length === 0 && officialSearchResults.length === 0 && (
            <p className="mt-3 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
              일치하는 등록 행사나 공식 포스터 자료가 없어요. 행사명은 그대로 직접 입력할 수
              있습니다.
            </p>
          )}
        </section>
      )}

      <button type="button" onClick={compare} disabled={analysis.status === "analyzing"} className="mt-5 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 font-extrabold text-primary-foreground disabled:opacity-50">
        입력 내용과 행사 자료 비교하기
      </button>

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
                <OfficialEventSaveButton event={selectedOfficialEvent} className="w-full" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FacilityPicker
        open={venuePickerOpen}
        onOpenChange={setVenuePickerOpen}
        selectedId={form.venue}
        onSelect={(venue) => {
          setForm((current) => ({ ...current, venue }));
          setVenuePickerOpen(false);
        }}
        includeAll={false}
        title="행사 장소 선택"
        description="행사가 열리는 올림픽공원 장소를 선택하세요"
        items={venueOptions}
        searchPlaceholder="장소 이름 검색"
      />
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
