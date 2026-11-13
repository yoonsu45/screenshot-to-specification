import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { ko } from "date-fns/locale";
import type { ParkEvent } from "@/data/events";
import { formatDate, formatRange } from "@/lib/event-service";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  initialDate?: string | undefined;
};

export function VisitDateDialog({ event, open, onOpenChange, onConfirm, initialDate }: Props) {
  const [visitDate, setVisitDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const lastDate = event.endDate ?? event.startDate;

  useEffect(() => {
    if (!open) return;

    const savedDate =
      initialDate && initialDate >= event.startDate && initialDate <= lastDate ? initialDate : "";
    setVisitDate(savedDate);
    setCalendarOpen(false);
  }, [event.startDate, initialDate, lastDate, open]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!visitDate) return;
    onConfirm(visitDate);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-[1.75rem]"
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
            <Button
              type="button"
              variant="outline"
              aria-label="방문 예정일 선택"
              aria-expanded={calendarOpen}
              aria-controls="visit-date-calendar"
              onClick={() => setCalendarOpen((current) => !current)}
              className="h-13 w-full touch-manipulation justify-between rounded-xl bg-card px-4 text-left text-base font-bold text-foreground"
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {visitDate ? formatDate(visitDate) : "날짜 선택하기"}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${calendarOpen ? "rotate-180" : ""}`}
              />
            </Button>
            {calendarOpen && (
              <div
                id="visit-date-calendar"
                className="mt-2 overflow-x-auto rounded-2xl border border-border bg-card p-1"
              >
                <Calendar
                  mode="single"
                  locale={ko}
                  selected={visitDate ? parseDateKey(visitDate) : undefined}
                  defaultMonth={parseDateKey(visitDate || event.startDate)}
                  startMonth={parseDateKey(event.startDate)}
                  endMonth={parseDateKey(lastDate)}
                  disabled={{
                    before: parseDateKey(event.startDate),
                    after: parseDateKey(lastDate),
                  }}
                  onSelect={(date) => {
                    if (!date) return;
                    setVisitDate(toDateKey(date));
                    setCalendarOpen(false);
                  }}
                  className="mx-auto w-fit [--cell-size:2.25rem]"
                />
              </div>
            )}
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

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
