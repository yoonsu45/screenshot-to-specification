import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, ImageIcon, Pencil, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/app-store";
import { EXAMPLE_CASE } from "@/lib/event-service";

export function CheckSheet() {
  const { checkOpen, setCheckOpen, setDraft } = useAppStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ title: "", date: "", venue: "", image: String(reader.result) });
      setCheckOpen(false);
      navigate({ to: "/check" });
    };
    reader.readAsDataURL(file);
  };

  const Option = ({ icon: Icon, title, desc, onClick }: { icon: typeof Pencil; title: string; desc: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-card hover:bg-muted">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-7 w-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">{title}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );

  return (
    <Sheet open={checkOpen} onOpenChange={setCheckOpen}>
      <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-3xl px-5 pb-8 pt-3">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-border" />
        <SheetTitle className="text-2xl font-extrabold text-primary">행사 확인하기</SheetTitle>
        <SheetDescription>캡처나 직접 입력으로 확인해요</SheetDescription>
        <div className="mt-4 space-y-3">
          <Option icon={ImageIcon} title="파일 업로드" desc="갤러리나 파일에서 캡처 이미지 선택" onClick={() => fileRef.current?.click()} />
          <Option
            icon={Pencil}
            title="직접 입력"
            desc="행사명 · 날짜 · 장소"
            onClick={() => {
              setDraft({ title: "", date: "", venue: "" });
              setCheckOpen(false);
              navigate({ to: "/check" });
            }}
          />
        </div>
        <button
          onClick={() => {
            setDraft(EXAMPLE_CASE);
            setCheckOpen(false);
            navigate({ to: "/check" });
          }}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          <Sparkles className="h-4 w-4" /> 예시로 체험하기
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </SheetContent>
    </Sheet>
  );
}
