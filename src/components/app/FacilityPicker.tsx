import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { searchFacilities } from "@/data/facilities";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedId: string;
  onSelect: (id: string) => void;
};

function PickerBody({ selectedId, onSelect }: Pick<Props, "selectedId" | "onSelect">) {
  const [q, setQ] = useState("");
  const list = searchFacilities(q);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="시설 이름 검색"
          aria-label="시설 이름 검색"
          className="h-12 w-full rounded-full border border-input bg-card pl-12 pr-4 text-base outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <ul className="min-h-0 flex-1 overflow-y-auto pb-4">
        {list.map((f) => {
          const active = f.id === selectedId;
          return (
            <li key={f.id} className="border-b border-border last:border-0">
              <button
                onClick={() => onSelect(f.id)}
                className={`my-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-semibold ${active ? "bg-lime text-lime-foreground" : "hover:bg-muted"}`}
              >
                <span className="min-w-0 truncate">{f.name}</span>
                {active && <Check className="h-5 w-5 shrink-0" />}
              </button>
            </li>
          );
        })}
        {list.length === 1 && q && <li className="px-4 py-6 text-center text-muted-foreground">검색 결과가 없어요</li>}
      </ul>
    </div>
  );
}

export function FacilityPicker(props: Props) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetContent side="bottom" className="flex h-[78dvh] flex-col rounded-t-3xl px-5 pt-3">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-border" />
          <SheetTitle className="text-2xl font-extrabold text-primary">장소 선택</SheetTitle>
          <SheetDescription className="sr-only">행사를 볼 시설을 고르세요</SheetDescription>
          <PickerBody {...props} />
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex h-[70vh] max-w-md flex-col rounded-3xl">
        <DialogTitle className="text-2xl font-extrabold text-primary">장소 선택</DialogTitle>
        <DialogDescription className="sr-only">행사를 볼 시설을 고르세요</DialogDescription>
        <PickerBody {...props} />
      </DialogContent>
    </Dialog>
  );
}
