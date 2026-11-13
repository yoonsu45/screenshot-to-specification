import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/lib/app-store";
import { searchOfficialEvents } from "@/lib/event-service";

const PAGE_SIZE = 20;

export function OfficialEventBrowser() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const { setDraft } = useAppStore();
  const navigate = useNavigate();
  const matches = searchOfficialEvents(query);
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const visible = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="space-y-5" aria-label="공식 공공데이터 행사 조회">
      <div>
        <h1 className="text-2xl font-black text-primary">공식 공공데이터</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          한국체육산업개발 공연정보 Open API에서 수집한 자료입니다. 과거 기록을 포함하며, 실시간으로
          갱신되는 최신 일정은 아닙니다.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          상단 시설 선택과 관계없이 공식 자료 전체에서 검색합니다. 개최일이 없는 자료는 날짜 확인
          불가로 표시합니다.
        </p>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-bold">공식 행사명·장소 검색</span>
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
          <li
            key={event.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <span className="text-xs font-bold text-primary">공식 API 수집 자료</span>
            <h2 className="text-lg font-extrabold">{event.title}</h2>
            <p className="text-sm">장소: {event.venue || "확인 불가"}</p>
            <p className="text-sm">개최일: {event.startDate || "확인 불가"}</p>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">출처 확인</summary>
              <p className="mt-2">
                한국체육산업개발 공연정보 Open API · 원본 CSV 행 {event.sourceRows.join(", ")}
              </p>
            </details>
            <button
              type="button"
              className="mt-auto rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"
              onClick={() => {
                setDraft({ title: event.title, date: "", venue: "", officialRecordId: event.id });
                void navigate({ to: "/check" });
              }}
            >
              이 공식 자료와 비교하기
            </button>
          </li>
        ))}
      </ul>
      {matches.length > 0 && (
        <nav aria-label="공식 자료 페이지" className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-xl border px-4 py-2 disabled:opacity-40"
          >
            이전
          </button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border px-4 py-2 disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
    </section>
  );
}
