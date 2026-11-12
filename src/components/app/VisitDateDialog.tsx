import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, MapPin } from "lucide-react";
import type { ParkEvent } from "@/data/events";
import { formatDate, formatRange } from "@/lib/event-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  event: ParkEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (visitDate: string) => void;
  initialDate?: string;
};

export function VisitDateDialog({ event, open, onOpenChange, onConfirm, initialDate }: Props) {
  const [visitDate, setVisitDate] = useState("");
  const lastDate = event.endDate ?? event.startDate;

  useEffect(() => {
    if (!open) return;

    const savedDate =
      initialDate && initialDate >= event.startDate && initialDate <= lastDate
        ? initialDate
        : "";
    setVisitDate(savedDate);
  }, [event.startDate, initialDate, lastDate, open]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!visitDate) return;
    onConfirm(visitDate);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md rounded-[1.75rem]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-primary">방문 예정일 선택</DialogTitle>
          <DialogDescription>실제로 방문할 날짜 하루를 선택해 주세요.</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-secondary/70 p-4">
          <p className="font-black text-primary">{event.title}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            행사 기간 {formatRange(event)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {event.venue}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="mb-2 block text-sm font-extrabold text-primary">방문 예정일</span>
            <div className="relative">
              <div
                aria-hidden="true"
                className="flex h-13 w-full items-center justify-between rounded-xl border border-input bg-card px-4 text-left text-base font-bold text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {visitDate ? formatDate(visitDate) : "날짜 선택하기"}
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="date"
                value={visitDate}
                min={event.startDate}
                max={lastDate}
                onChange={(e) => setVisitDate(e.target.value)}
                aria-label="방문 예정일 선택"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-[0.01] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <span className="mt-2 block text-xs text-muted-foreground">
              행사 기간 안의 날짜만 선택할 수 있어요.
            </span>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!visitDate}
              className="w-full rounded-xl font-extrabold sm:w-auto"
            >
              이 날짜로 담기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
