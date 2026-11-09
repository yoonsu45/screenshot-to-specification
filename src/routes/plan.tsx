import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "내 방문 계획 — 올팍 행사체크" },
      { name: "description", content: "담아둔 행사와 주변 장소를 한눈에 확인하세요." },
      { property: "og:title", content: "내 방문 계획 — 올팍 행사체크" },
      { property: "og:description", content: "담아둔 행사와 주변 장소를 한눈에 확인하세요." },
    ],
  }),
  component: Plan,
});

function Plan() {
  const { plan, removePlan } = useAppStore();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-black text-primary sm:text-3xl">내 방문 계획</h1>
      <p className="mb-5 text-sm text-muted-foreground">로그인 없이 이 기기에 저장돼요.</p>
      {plan.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">아직 담은 항목이 없어요. 대조 결과나 주변 화면에서 담아 보세요.</p>
      ) : (
        <ul className="space-y-3">
          {plan.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                {p.kind === "event" ? <CalendarDays className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{p.title}</p>
                <p className="truncate text-sm text-muted-foreground">{p.subtitle}</p>
              </div>
              <button onClick={() => removePlan(p.id)} aria-label={`${p.title} 삭제`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
