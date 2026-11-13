import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, ImageIcon, LoaderCircle, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/app-store";
import { EXAMPLE_CASE } from "@/lib/event-service";

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
        <button
          type="button"
          onClick={() => {
            setDraft(EXAMPLE_CASE);
            setCheckOpen(false);
            navigate({ to: "/check" });
          }}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          <Sparkles className="h-4 w-4" /> 예시로 체험하기
        </button>
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

async function optimizeImage(file: File) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}
