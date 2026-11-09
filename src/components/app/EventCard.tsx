import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import type { ParkEvent } from "@/data/events";
import { getFacility } from "@/data/facilities";
import { formatRange } from "@/lib/event-service";

export function EventCard({ event, showFacility, onClick }: { event: ParkEvent; showFacility?: boolean; onClick?: () => void }) {
  const facility = getFacility(event.facilityId);
  return (
    <button onClick={onClick} className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-card p-2 text-left shadow-card transition hover:-translate-y-0.5 sm:gap-4">
      <img src={event.image} alt="" loading="lazy" width={944} height={704} className="h-20 w-24 shrink-0 rounded-xl object-cover sm:h-24 sm:w-32" />
      <div className="min-w-0 flex-1 py-1">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">{event.category}</span>
          {event.demo && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-lime-foreground">시연용 데이터</span>}
        </div>
        <h3 className="truncate text-base font-extrabold sm:text-lg">{event.title}</h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{formatRange(event)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{showFacility ? `${facility?.name} · ` : ""}{event.venue}</span>
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
