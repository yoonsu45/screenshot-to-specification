import { useState } from "react";
import { Bookmark, CalendarDays, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ParkEvent } from "@/data/events";
import { getFacility } from "@/data/facilities";
import { formatRange } from "@/lib/event-service";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ADD_LABEL = "\uB2F4\uAE30";

export function EventCard({ event, showFacility, onClick }: { event: ParkEvent; showFacility?: boolean; onClick?: (() => void) | undefined }) {
  const facility = getFacility(event.facilityId);
  const { addPlan, removePlan, plan } = useAppStore();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isAdded = plan.some((item) => item.id === `event:${event.id}`);

  function addEvent() {
    addPlan({
      id: `event:${event.id}`,
      kind: "event",
      title: event.title,
      subtitle: `${formatRange(event)} · ${event.venue}`,
    });
    toast.success(isAdded ? "이미 담긴 행사예요." : "행사를 방문 계획에 담았어요.");
  }

  function toggleBookmark() {
    if (isAdded) {
      removePlan(`event:${event.id}`);
      toast.success("방문 계획에서 뺐어요.");
      return;
    }
    addEvent();
  }

  return (
    <>
      <article className="flex w-full min-w-0 items-center gap-2 rounded-[1.75rem] bg-card p-3 text-left shadow-card transition hover:-translate-y-0.5 sm:p-4">
        <button type="button" onClick={() => setDetailsOpen(true)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
          <img src={event.image} alt="" loading="lazy" width={944} height={704} className="h-28 w-32 shrink-0 rounded-[1.35rem] object-cover sm:h-32 sm:w-40" />
          <div className="min-w-0 flex-1 py-1">
            <h3 className="mb-3 line-clamp-2 text-xl font-black leading-tight text-primary sm:text-2xl">{event.title}</h3>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground sm:text-base"><CalendarDays className="h-5 w-5 shrink-0 text-primary" /><span className="truncate">{formatCompactRange(event)}</span></p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground sm:text-base"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span className="truncate">{showFacility ? `${facility?.name} · ` : ""}{event.venue}</span></p>
          </div>
        </button>
        <button type="button" aria-label={isAdded ? "방문 계획에서 빼기" : "방문 계획에 담기"} onClick={toggleBookmark} className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-primary transition hover:bg-secondary">
          <Bookmark className={`h-7 w-7 ${isAdded ? "fill-brand-orange text-brand-orange" : ""}`} />
        </button>
      </article>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary">{event.title}</DialogTitle>
            <DialogDescription>시연용 예시 데이터 · 실제 행사 아님 · {event.category} · {event.venue}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatRange(event)}</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{facility?.name ?? event.facilityId} · {event.venue}</p>
            <p className="text-muted-foreground">행사 정보를 확인하고 방문 계획에 담아보세요.</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" onClick={addEvent} className="rounded-xl font-bold"><Plus />{isAdded ? "담김" : ADD_LABEL}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatCompactRange(event: ParkEvent) {
  return formatRange(event)
    .replace(/^\d{4}\./, "")
    .replace(/\s~\s/g, " – ")
    .replace(/(\d{2}\.\d{2})\((.)\)/g, "$1 ($2)");
}
