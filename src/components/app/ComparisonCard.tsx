import type { VerifyResult } from "@/lib/event-service";

type Field = VerifyResult["fields"][number];

const badge = (s: Field["status"]) =>
  s === "same" ? (
    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-success">
      같음
    </span>
  ) : s === "different" ? (
    <span className="rounded-full bg-warn px-2.5 py-0.5 text-xs font-bold text-warn-foreground">
      다름
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
      확인 필요
    </span>
  );

const officialCls = (f: Field) =>
  f.status === "different"
    ? "rounded-md bg-lime px-1.5 font-extrabold text-lime-foreground"
    : "font-semibold";

/** 모바일: 항목별 카드 */
export function ComparisonCard({ field }: { field: Field }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground">{field.label}</span>
        {badge(field.status)}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">입력 정보</dt>
          <dd className="break-words font-semibold">{field.input || "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">비교 자료</dt>
          <dd className="break-words">
            <span className={officialCls(field)}>{field.official || "—"}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** 데스크톱: 표 */
export function ComparisonTable({ fields }: { fields: Field[] }) {
  return (
    <table className="w-full table-fixed overflow-hidden rounded-2xl bg-card text-left shadow-card">
      <thead className="bg-secondary text-sm text-muted-foreground">
        <tr>
          <th className="w-24 px-4 py-3">항목</th>
          <th className="px-4 py-3">입력 정보</th>
          <th className="px-4 py-3">비교 자료</th>
          <th className="w-28 px-4 py-3">결과</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.label} className="border-t border-border">
            <td className="px-4 py-4 text-sm font-bold text-muted-foreground">{f.label}</td>
            <td className="break-words px-4 py-4 font-semibold">{f.input || "—"}</td>
            <td className="break-words px-4 py-4">
              <span className={officialCls(f)}>{f.official || "—"}</span>
            </td>
            <td className="px-4 py-4">{badge(f.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
