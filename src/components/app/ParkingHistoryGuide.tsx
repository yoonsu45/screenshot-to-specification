import { useState } from "react";
import history from "@/data/parking-history.json";

export function ParkingHistoryGuide({ parkingName }: { parkingName: string }) {
  const years = [...new Set(history.monthly.rows.map((row) => row.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]!);
  const months = history.monthly.rows.filter((row) => row.year === year);
  const zoneNames: string[] = parkingName.match(/P\d+[AB]?/g) ?? [];
  const records = history.congestion.latestByZone.filter((row) => zoneNames.includes(row.zone));
  const busiest = [...history.flow.hours].sort((a, b) => (b.dailyAverage ?? 0) - (a.dailyAverage ?? 0))[0];

  return <details className="border-t border-border pt-3">
    <summary className="cursor-pointer text-sm font-bold">과거 주차 이용 참고 · 제공받은 공식 CSV</summary>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">과거 이용 기록입니다. 현재 빈자리나 도착 시점의 혼잡 예측으로 사용할 수 없습니다. 실시간 현황과 기간·집계 범위가 다를 수 있습니다.</p>
    <div className="mt-3 rounded-xl bg-secondary/60 p-3">
      <h3 className="text-sm font-bold">가까운 주차장의 마지막 수록 혼잡 기록</h3>
      {records.length ? records.map((row) => <p key={row.zone} className="mt-2 text-xs leading-5"><strong>{row.zone} · {row.statuses.length === 1 ? row.statuses[0] : "동일 시각 기록 충돌 · 판정 보류"}</strong><br />기록 시각 {row.at} (한국시간) · 현재 현황 아님</p>) : <p className="mt-2 text-xs text-muted-foreground">이 주차구역에 연결할 수 있는 과거 기록이 없습니다.</p>}
      <p className="mt-2 text-xs text-muted-foreground">원본 {history.congestion.sourceRows.toLocaleString("ko-KR")}건 중 ID·구역 불일치 {history.congestion.rejectedRows}건 제외. 마지막 수록 상태는 기록 이후에도 유지됐다는 뜻이 아닙니다.</p>
      <a className="text-xs underline" href="https://www.data.go.kr/data/15164156/fileData.do" target="_blank" rel="noopener noreferrer">혼잡도 자료 출처</a>
    </div>
    <div className="mt-3 rounded-xl bg-secondary/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">올림픽공원 월별 주차 이용량</h3>
        <select aria-label="월별 주차 통계 연도" value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded border border-border bg-card p-1 text-xs">{years.map((value) => <option key={value} value={value}>{value}년</option>)}</select>
      </div>
      <p className="my-2 text-xs text-muted-foreground">월간 누적 이용량이며 동시에 주차한 차량 수가 아닙니다. 미사경정공원 자료는 제외했습니다.</p>
      <table className="w-full text-xs"><caption className="sr-only">{year}년 월별 주차 이용량</caption><thead><tr><th scope="col" className="py-1 text-left">월</th><th scope="col" className="text-right">누적 이용량 · 대</th></tr></thead><tbody>{months.map((row) => <tr key={row.month} className="border-t border-border"><th scope="row" className="py-1 text-left font-normal">{row.month}월</th><td className="text-right tabular-nums">{row.total.toLocaleString("ko-KR")}</td></tr>)}</tbody></table>
      <a className="text-xs underline" href="https://www.data.go.kr/data/15131671/fileData.do" target="_blank" rel="noopener noreferrer">월별 자료 출처</a>
    </div>
    <div className="mt-3 rounded-xl bg-secondary/60 p-3">
      <h3 className="text-sm font-bold">2024년 7월 시간대별 입차 기록</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{history.flow.start}~{history.flow.end}, {history.flow.days}일 · {history.flow.validEntries.toLocaleString("ko-KR")}건. 주차구역 정보가 없어 공연장별 통계로 나누지 않았습니다.</p>
      {busiest && <p className="mt-2 text-xs font-bold">당시 입차가 가장 많았던 시간: {busiest.hour}~{busiest.hour + 1}시 · 하루 평균 {busiest.dailyAverage?.toLocaleString("ko-KR")}대</p>}
      <details className="mt-2"><summary className="cursor-pointer text-xs underline">24시간 기록 보기</summary><table className="mt-2 w-full text-xs"><thead><tr><th className="text-left" scope="col">시간대</th><th className="text-right" scope="col">하루 평균 입차 · 대</th></tr></thead><tbody>{history.flow.hours.map((row) => <tr key={row.hour} className="border-t border-border"><th scope="row" className="py-1 text-left font-normal">{row.hour}~{row.hour + 1}시</th><td className="text-right tabular-nums">{row.dailyAverage?.toLocaleString("ko-KR") ?? "미확인"}</td></tr>)}</tbody></table></details>
      <p className="mt-2 text-xs text-muted-foreground">입차량은 주차 중인 차량 수·점유율이 아닙니다. 다른 월·연도의 현재 상황을 예측하지 않습니다.</p>
      <a className="text-xs underline" href="https://www.data.go.kr/data/15138735/fileData.do" target="_blank" rel="noopener noreferrer">입출차 자료 출처</a>
    </div>
  </details>;
}
