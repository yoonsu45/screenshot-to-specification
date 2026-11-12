import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { EXAMPLE_CASE } from "@/lib/event-service";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "행사 정보 입력 — 올팍 행사체크" },
      { name: "description", content: "행사명·날짜·장소를 입력해 공식 일정과 대조하세요." },
      { property: "og:title", content: "행사 정보 입력 — 올팍 행사체크" },
      { property: "og:description", content: "행사명·날짜·장소를 입력해 공식 일정과 대조하세요." },
    ],
  }),
  component: CheckPage,
});

function CheckPage() {
  const { draft, setDraft } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(draft);
  const [error, setError] = useState(false);

  const submit = () => {
    if (!form.title.trim()) return setError(true);
    setDraft(form);
    navigate({ to: "/result" });
  };

  const field = "h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-black text-primary sm:text-3xl">행사 정보 입력</h1>
      <p className="mb-5 text-sm text-muted-foreground">게시물에 적힌 내용을 그대로 입력해 주세요.</p>

      {form.image && (
        <img src={form.image} alt="선택한 캡처 이미지" className="mb-5 max-h-72 w-full rounded-2xl border border-border bg-card object-contain" />
      )}

      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-card">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">행사명 <span className="text-destructive">*</span></span>
          <input className={field} value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(false); }} placeholder="예: CRAVITY CONCERT" />
          {error && <span className="mt-1 block text-sm text-destructive">행사명을 입력해 주세요.</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">날짜 <span className="font-normal text-muted-foreground">(선택)</span></span>
          <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">장소 <span className="font-normal text-muted-foreground">(선택)</span></span>
          <input className={field} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="예: KSPO DOME" />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button onClick={submit} className="h-13 flex-1 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-fab">공식 일정과 대조하기</button>
        <button onClick={() => { setForm({ ...EXAMPLE_CASE, image: form.image }); setError(false); }} className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3.5 font-bold text-primary">
          <Sparkles className="h-4 w-4" /> 예시로 체험하기
        </button>
      </div>
    </div>
  );
}
