import { useState } from "react";
import { AlertCircle, Car, Database, LoaderCircle, RefreshCw } from "lucide-react";
import {
  getParkingHistorySamples,
  type ParkingHistoryResult,
} from "@/lib/parking-service";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: ParkingHistoryResult }
  | { status: "error"; message: string };

export function ParkingHistoryCard() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  async function load() {
    setState({ status: "loading" });
    try {
      const data = await getParkingHistorySamples();
      setState({ status: "success", data });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "주차 데이터를 불러오지 못했어요.",
      });
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-lime-foreground">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-extrabold text-primary">2025년 올림픽공원 주차 데이터</h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              공식 입출차 이력 표본이며 현재 잔여 주차면은 아니에요.
            </p>
          </div>
        </div>
        {state.status === "success" && (
          <button
            type="button"
            onClick={() => void load()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-primary transition hover:bg-secondary"
            aria-label="주차 데이터 새로고침"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {state.status === "idle" && (
        <div className="px-4 py-5">
          <p className="text-sm leading-6 text-muted-foreground">
            입차일시, 출차일시와 주차구역 표본을 확인할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground"
          >
            <Database className="h-4 w-4" /> 주차 데이터 확인
          </button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-semibold text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" /> 공식 데이터를 불러오는 중이에요
        </div>
      )}

      {state.status === "error" && (
        <div className="px-4 py-5">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{state.message}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-extrabold text-primary"
          >
            다시 시도
          </button>
        </div>
      )}

      {state.status === "success" && (
        <div className="px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>표본 {state.data.samples.length}건</span>
            {state.data.totalCount !== null && (
              <span>전체 {state.data.totalCount.toLocaleString("ko-KR")}건</span>
            )}
          </div>
          <ul className="space-y-2">
            {state.data.samples.map((sample, index) => (
              <li
                key={`${sample.entryAt}-${sample.zone}-${index}`}
                className="rounded-xl bg-secondary/70 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-primary">{sample.zone}</span>
                  <span className="rounded-full bg-card px-2 py-1 text-[11px] font-bold text-muted-foreground">
                    {sample.exitAt ? "출차 완료" : "출차 기록 없음"}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">입차일시</dt>
                  <dd className="font-semibold">{formatParkingDate(sample.entryAt)}</dd>
                  <dt className="text-muted-foreground">출차일시</dt>
                  <dd className="font-semibold">
                    {sample.exitAt ? formatParkingDate(sample.exitAt) : "기록 없음"}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function formatParkingDate(value: string) {
  const compact = value.replace(/\D/g, "");
  if (compact.length >= 12) {
    return `${compact.slice(0, 4)}.${compact.slice(4, 6)}.${compact.slice(6, 8)} ${compact.slice(8, 10)}:${compact.slice(10, 12)}`;
  }
  return value;
}
