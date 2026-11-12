import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Car, LoaderCircle, RefreshCw } from "lucide-react";
import { getParkingSamples, type ParkingSampleResult } from "@/lib/parking-service";

type LoadState =
  | { status: "loading" }
  | { status: "success"; data: ParkingSampleResult }
  | { status: "error"; message: string };

let cachedParkingData: ParkingSampleResult | null = null;
let parkingRequest: Promise<ParkingSampleResult> | null = null;

function requestParkingData(force = false) {
  if (!force && cachedParkingData) return Promise.resolve(cachedParkingData);
  if (parkingRequest) return parkingRequest;

  parkingRequest = getParkingSamples()
    .then((data) => {
      cachedParkingData = data;
      return data;
    })
    .finally(() => {
      parkingRequest = null;
    });
  return parkingRequest;
}

export function ParkingSamples() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async (force = false) => {
    setState({ status: "loading" });
    try {
      const data = await requestParkingData(force);
      setState({ status: "success", data });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "주차 표본을 불러오지 못했어요.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      aria-labelledby="parking-sample-title"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-lime-foreground">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <h2 id="parking-sample-title" className="font-extrabold text-primary">
              올림픽공원 주차 데이터
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              2025년 입출차 이력 표본 · 현재 실시간 혼잡도가 아니에요
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={state.status === "loading"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-primary transition hover:bg-secondary disabled:cursor-wait disabled:opacity-50"
          aria-label="주차 데이터 새로고침"
        >
          <RefreshCw className={`h-4 w-4 ${state.status === "loading" ? "animate-spin" : ""}`} />
        </button>
      </div>

      {state.status === "loading" && (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-semibold text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" /> 입출차 표본을 확인하는 중이에요
        </div>
      )}

      {state.status === "error" && (
        <div className="px-4 py-5 text-sm text-amber-900">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{state.message}</p>
          </div>
        </div>
      )}

      {state.status === "success" && (
        <div className="px-4 py-4">
          {state.data.samples.length > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
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
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${sample.exitAt ? "bg-card text-muted-foreground" : "bg-brand-orange/10 text-brand-orange"}`}
                      >
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
            </>
          ) : (
            <p className="rounded-xl bg-secondary px-3 py-4 text-sm text-muted-foreground">
              {state.data.notice}
            </p>
          )}
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
