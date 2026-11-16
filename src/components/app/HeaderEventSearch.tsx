import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Flame, LoaderCircle, MapPin, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";
import { OfficialEventSaveButton } from "@/components/app/OfficialEventSaveButton";
import { searchOfficialEvents } from "@/lib/event-service";
import { getOfficialPoster, getOfficialSchedule } from "@/lib/official-posters";
import type { OfficialRecord } from "@/lib/official-data";
import { officialEvents } from "@/lib/official-data";
import {
  getTopEventSearches,
  recordEventSearch,
  type TopEventSearch,
} from "@/lib/event-search-analytics";

const RECENT_SEARCH_KEY = "the-check-recent-event-searches";
const MAX_RECENT_SEARCHES = 6;

function uniqueSearchResults(query: string) {
  const preferredByTitle = new Map<string, ReturnType<typeof searchOfficialEvents>[number]>();

  searchOfficialEvents(query).forEach((event) => {
    const key = `${event.title}:${event.venue ?? ""}`;
    const previous = preferredByTitle.get(key);
    if (!previous || (!getOfficialPoster(previous.id) && getOfficialPoster(event.id))) {
      preferredByTitle.set(key, event);
    }
  });

  return [...preferredByTitle.values()]
    .sort(
      (left, right) =>
        Number(Boolean(getOfficialPoster(right.id))) - Number(Boolean(getOfficialPoster(left.id))),
    )
    .slice(0, 12);
}

export function HeaderEventSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OfficialRecord | null>(null);
  const [topSearches, setTopSearches] = useState<TopEventSearch[]>([]);
  const [topSearchesLoading, setTopSearchesLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
      if (Array.isArray(stored)) {
        setRecentSearches(stored.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_SEARCHES));
      }
    } catch {
      localStorage.removeItem(RECENT_SEARCH_KEY);
    }
  }, []);

  const results = useMemo(
    () => (submittedQuery ? uniqueSearchResults(submittedQuery) : []),
    [submittedQuery],
  );
  const visibleTopSearches = useMemo(
    () =>
      topSearches.flatMap((item) => {
        const event = officialEvents.find((candidate) => candidate.id === item.eventId);
        return event ? [{ ...item, event }] : [];
      }),
    [topSearches],
  );

  function rememberSearch(value: string) {
    const term = value.trim();
    if (!term) return;

    setRecentSearches((current) => {
      const next = [
        term,
        ...current.filter((item) => item.toLocaleLowerCase("ko-KR") !== term.toLocaleLowerCase("ko-KR")),
      ].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
      return next;
    });
  }

  function search(value: string) {
    const term = value.trim();
    if (!term) return;
    setQuery(term);
    setSubmittedQuery(term);
    setSelectedEvent(null);
    rememberSearch(term);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search(query);
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCH_KEY);
  }

  function resetSearch() {
    setQuery("");
    setSubmittedQuery("");
    setSelectedEvent(null);
  }

  async function loadTopSearches() {
    setTopSearchesLoading(true);
    try {
      setTopSearches(await getTopEventSearches());
    } catch {
      setTopSearches([]);
    } finally {
      setTopSearchesLoading(false);
    }
  }

  function selectEvent(event: OfficialRecord) {
    setSelectedEvent(event);
    void recordEventSearch(event.id).catch(() => undefined);
  }

  function openSearch() {
    setOpen(true);
    void loadTopSearches();
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetSearch();
  }

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-label="행사 검색"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary bg-background text-primary hover:bg-secondary"
      >
        <Search className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="top-2 max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-xl translate-y-0 overflow-hidden rounded-2xl p-0 sm:top-1/2 sm:max-h-[90dvh] sm:w-full sm:-translate-y-1/2"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain p-4 pt-12 sm:max-h-[90dvh] sm:p-6 sm:pt-10">
            <DialogHeader>
              <DialogTitle className="text-left text-xl font-black text-primary">행사 검색</DialogTitle>
              <DialogDescription className="text-left">
                행사명이나 장소를 입력해 일정을 찾아보세요.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <label htmlFor="header-event-search" className="sr-only">행사명 또는 장소 검색</label>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="header-event-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="행사명 또는 장소"
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 outline-none focus:border-primary"
                />
                {query && (
                  <button
                    type="button"
                    onClick={resetSearch}
                    aria-label="검색 초기화"
                    className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button type="submit" className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground">
                검색
              </button>
            </form>

            {!submittedQuery && !selectedEvent && (
              <>
                <section className="mt-6" aria-labelledby="recent-search-title">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="recent-search-title" className="flex items-center gap-2 font-extrabold text-primary">
                      <Clock3 className="h-4 w-4" /> 최근 검색어
                    </h2>
                    {recentSearches.length > 0 && (
                      <button type="button" onClick={clearRecentSearches} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-3.5 w-3.5" /> 전체 삭제
                      </button>
                    )}
                  </div>
                  {recentSearches.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button key={term} type="button" onClick={() => search(term)} className="rounded-full bg-secondary px-3 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground">
                          {term}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">최근 검색한 행사가 없습니다.</p>
                  )}
                </section>

                <section className="mt-6" aria-labelledby="popular-search-title">
                  <h2 id="popular-search-title" className="flex items-center gap-2 font-extrabold text-primary">
                    <Flame className="h-4 w-4 text-brand-orange" /> 지금 많이 검색하는 행사
                  </h2>
                  {topSearchesLoading ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin" /> 인기 행사를 불러오는 중이에요.
                    </div>
                  ) : visibleTopSearches.length > 0 ? (
                    <ol className="mt-3 space-y-2">
                      {visibleTopSearches.map((item, index) => {
                        const { event } = item;
                        return (
                          <li key={item.eventId}>
                            <button
                              type="button"
                              onClick={() => selectEvent(event)}
                              className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left hover:border-primary hover:bg-secondary/40"
                            >
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                                {index + 1}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-extrabold text-primary">{event.title}</span>
                              <span className="shrink-0 text-xs font-bold text-muted-foreground">{item.searchCount.toLocaleString("ko-KR")}회</span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="mt-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                      검색 데이터가 쌓이면 최근 7일 인기 행사가 표시됩니다.
                    </p>
                  )}
                </section>
              </>
            )}

            {submittedQuery && !selectedEvent && (
              <section className="mt-6" aria-live="polite">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-extrabold text-primary">‘{submittedQuery}’ 검색 결과</h2>
                  <button type="button" onClick={resetSearch} className="flex shrink-0 items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
                    <RotateCcw className="h-3.5 w-3.5" /> 검색 초기화
                  </button>
                </div>
                {results.length > 0 ? (
                  <ul className="space-y-3">
                    {results.map((event) => {
                      const schedule = getOfficialSchedule(event.id);
                      return (
                        <li key={event.id}>
                            <article className="rounded-2xl border bg-card p-3 transition hover:border-primary">
                              <button
                                type="button"
                                onClick={() => selectEvent(event)}
                                aria-label={`${event.title} 행사 정보 보기`}
                                className="flex w-full min-w-0 gap-3 text-left hover:opacity-80"
                              >
                                <OfficialPosterImage eventId={event.id} title={event.title} className="h-20 w-16 shrink-0 rounded-xl sm:w-20" />
                                <span className="min-w-0 flex-1 py-0.5">
                                  <span className="line-clamp-2 font-black leading-snug text-primary">{event.title}</span>
                                  <span className="mt-2 flex items-start gap-1.5 text-xs text-foreground">
                                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="break-words">{schedule.raw || event.startDate || "날짜 확인 불가"}</span>
                                  </span>
                                  <span className="mt-1 flex items-center gap-1.5 text-xs text-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="truncate">{event.venue || "장소 확인 불가"}</span>
                                  </span>
                                  <span className="mt-2 block text-xs font-extrabold text-brand-orange">행사 정보 보기</span>
                                </span>
                              </button>
                              <OfficialEventSaveButton event={event} className="mt-3 w-full" />
                            </article>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-xl bg-muted/60 p-5 text-center text-sm text-muted-foreground">일치하는 행사를 찾지 못했어요.</p>
                )}
              </section>
            )}

            {selectedEvent && (
              <section className="mt-6" aria-label="선택한 행사 정보">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setSelectedEvent(null)} className="flex items-center gap-1 text-sm font-extrabold text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" /> {submittedQuery ? "검색 결과" : "검색 화면"}
                  </button>
                  <button type="button" onClick={resetSearch} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
                    <RotateCcw className="h-3.5 w-3.5" /> 검색 초기화
                  </button>
                </div>
                <OfficialPosterImage
                  eventId={selectedEvent.id}
                  title={selectedEvent.title}
                  className="max-h-72 min-h-40 w-full rounded-2xl"
                />
                <div className="mt-4 rounded-2xl border bg-card p-4">
                  <h2 className="break-words text-xl font-black leading-snug text-primary [overflow-wrap:anywhere]">
                    {selectedEvent.title}
                  </h2>
                  <p className="mt-4 flex items-start gap-2 text-sm">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{getOfficialSchedule(selectedEvent.id).raw || selectedEvent.startDate || "날짜 확인 불가"}</span>
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{selectedEvent.venue || "장소 확인 불가"}</span>
                  </p>
                  <OfficialEventSaveButton event={selectedEvent} className="mt-4 w-full" />
                </div>
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
