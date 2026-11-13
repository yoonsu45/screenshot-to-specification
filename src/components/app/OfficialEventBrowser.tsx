import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Music2 } from "lucide-react";
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

const PAGE_SIZE = 20;

export function OfficialEventBrowser() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ReturnType<typeof searchOfficialEvents>[number] | null>(
    null,
  );
  const { facilityId, setDraft } = useAppStore();
  useEffect(() => {
    setPage(0);
  }, [facilityId]);
  const navigate = useNavigate();
  const matches = searchOfficialEvents(query).filter((event) => {
    if (facilityId === "all") return true;
    if (facilityId === "olympic-park")
      return Boolean(
        event.venue &&
        /올림픽홀|KSPO DOME|핸드볼경기장|뮤즈라이브|우리금융아트홀|K-아트홀|88잔디마당|평화의광장|소마미술관/.test(
          event.venue,
        ),
      );
    return event.venue === getFacility(facilityId)?.name;
  });
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
          한국체육산업개발 공연정보 Open API에서 수집한 자료입니다. 과거 기록을 포함하며, 실시간으로
          갱신되는 최신 일정은 아닙니다.
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
            <button
              type="button"
              aria-label={`${event.title} 상세 보기`}
              className="flex w-full min-w-0 items-center gap-4 rounded-[1.75rem] bg-card p-3 text-left shadow-card transition hover:-translate-y-0.5 sm:p-4"
              onClick={() => setSelected(event)}
            >
              <span className="flex h-28 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-[1.35rem] bg-secondary text-primary sm:h-32 sm:w-40">
                <Music2 className="h-10 w-10" />
                <span className="text-xs font-bold">공식 공연정보</span>
              </span>
              <span className="min-w-0 flex-1 py-1">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                  공식 API 자료
                </span>
                <span className="mb-3 line-clamp-2 text-xl font-black leading-tight text-primary sm:text-2xl">
                  {event.title}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                  {event.startDate || "날짜 확인 불가"}
                </span>
                <span className="mt-1 flex items-center gap-2 text-sm">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate">{event.venue || "장소 확인 불가"}</span>
                </span>
              </span>
            </button>
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
            <DialogDescription>공식 API에서 수집한 행사 정보</DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
                <p>개최일: {selected.startDate || "확인 불가"}</p>
                <p>장소: {selected.venue || "확인 불가"}</p>
                <p>출처: 한국체육산업개발 공연정보 Open API</p>
                <p className="text-xs text-muted-foreground">
                  원본 CSV 행: {selected.sourceRows.join(", ")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                최신 일정과 다를 수 있습니다. 개최일이 확인되지 않아 달력 표시·방문일 저장은
                제공하지 않습니다.
              </p>
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
    </section>
  );
}
