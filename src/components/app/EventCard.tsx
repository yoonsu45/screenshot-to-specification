import { useState } from "react";
import { CalendarDays, ChevronRight, ExternalLink, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ParkEvent } from "@/data/events";
import { getFacility } from "@/data/facilities";
import { formatRange } from "@/lib/event-service";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DETAIL_LABEL = "\uC790\uC138\uD788 \uBCF4\uAE30";
const ADD_LABEL = "\uB2F4\uAE30";

export function EventCard({ event, showFacility, onClick }: { event: ParkEvent; showFacility?: boolean; onClick?: (() => void) | undefined }) {
  const facility = getFacility(event.facilityId);
  const { addPlan, plan } = useAppStore();
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

  function openOfficialSite() {
    if (onClick) {
      onClick();
      return;
    }
    toast.info("아직 연결된 공식 사이트가 없는 행사예요.");
  }

  return (
    <>
      <article className="flex w-full min-w-0 gap-3 rounded-2xl bg-card p-2 text-left shadow-card transition hover:-translate-y-0.5 sm:gap-4">
        <img src={event.image} alt="" loading="lazy" width={944} height={704} className="h-20 w-24 shrink-0 rounded-xl object-cover sm:h-24 sm:w-32" />
        <div className="min-w-0 flex-1 py-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">{event.category}</span>
          </div>
          <h3 className="truncate text-base font-extrabold sm:text-lg">{event.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{formatRange(event)}</span></p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{showFacility ? `${facility?.name} · ` : ""}{event.venue}</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDetailsOpen(true)} className="h-8 rounded-full px-3 text-xs font-bold">{DETAIL_LABEL}</Button>
            <Button type="button" size="sm" onClick={addEvent} className="h-8 rounded-full px-3 text-xs font-bold"><Plus />{isAdded ? "담김" : ADD_LABEL}</Button>
          </div>
        </div>
        <button type="button" aria-label="공식 사이트 열기" onClick={openOfficialSite} className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary">
          <ChevronRight className="h-5 w-5" />
        </button>
      </article>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary">{event.title}</DialogTitle>
            <DialogDescription>{event.category} · {event.venue}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatRange(event)}</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{facility?.name ?? event.facilityId} · {event.venue}</p>
            <p className="text-muted-foreground">행사 정보를 확인하고 방문 계획에 담아보세요.</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" onClick={addEvent} className="rounded-xl font-bold"><Plus />{isAdded ? "담김" : ADD_LABEL}</Button>
            <Button type="button" variant="outline" onClick={openOfficialSite} className="rounded-xl font-bold"><ExternalLink />공식 사이트</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
