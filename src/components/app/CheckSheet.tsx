import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, ImageIcon, LoaderCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/app-store";
import { optimizeImage } from "@/lib/image-optimization";

export function CheckSheet() {
  const { checkOpen, setCheckOpen, setDraft } = useAppStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일을 선택해 주세요.");
      return;
    }

    setPreparing(true);
    try {
      const image = await optimizeImage(file);
      setDraft({ title: "", date: "", venue: "", image });
      setCheckOpen(false);
      navigate({ to: "/check" });
    } catch {
      toast.error("이미지를 불러오지 못했어요. 다른 이미지를 선택해 주세요.");
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const Option = ({
    icon: Icon,
    title,
    desc,
    onClick,
    disabled = false,
  }: {
    icon: typeof Pencil;
    title: string;
    desc: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition hover:bg-muted disabled:cursor-wait disabled:opacity-60"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        {disabled ? (
          <LoaderCircle className="h-7 w-7 animate-spin" />
        ) : (
          <Icon className="h-7 w-7" />
        )}
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
        <SheetDescription>브라우저에서 캡처 글자를 읽거나 직접 검색해요</SheetDescription>
        <div className="mt-4 space-y-3">
          <Option
            icon={ImageIcon}
            title={preparing ? "이미지 준비 중" : "캡처 이미지 글자 읽기"}
            desc="기기에서 한글 · 영문을 읽고 행사 정보를 찾아요"
            disabled={preparing}
            onClick={() => fileRef.current?.click()}
          />
          <Option
            icon={Pencil}
            title="직접 입력 · 검색"
            desc="공연명을 검색하거나 행사 정보를 직접 입력"
            onClick={() => {
              setDraft({ title: "", date: "", venue: "" });
              setCheckOpen(false);
              navigate({ to: "/check" });
            }}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
      </SheetContent>
    </Sheet>
  );
}
