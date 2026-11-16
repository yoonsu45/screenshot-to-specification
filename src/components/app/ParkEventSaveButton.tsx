import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";
import { TicketlinkBookingButton } from "@/components/app/TicketlinkBookingButton";
import type { ParkEvent } from "@/data/events";
import { useAppStore } from "@/lib/app-store";
import { formatDate } from "@/lib/event-service";
import { cn } from "@/lib/utils";

const SAVE_LABEL = "\uB2F4\uAE30";
const CHANGE_DATE_LABEL = "\uBC29\uBB38\uC77C \uBCC0\uACBD";

export function ParkEventSaveButton({ event, className }: { event: ParkEvent; className?: string }) {
  const { addPlan, plan, requireAuth } = useAppStore();
  const [visitDateOpen, setVisitDateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const plannedItem = plan.find((item) => item.id === `event:${event.id}`);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (requireAuth()) setVisitDateOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground transition hover:brightness-95 disabled:opacity-50",
          className,
        )}
      >
        <Plus className="h-4 w-4" />
        {plannedItem ? CHANGE_DATE_LABEL : SAVE_LABEL}
      </button>
      <TicketlinkBookingButton title={event.title} className="mt-2 w-full" />

      <VisitDateDialog
        event={event}
        open={visitDateOpen}
        onOpenChange={setVisitDateOpen}
        initialDate={plannedItem?.startDate}
        onConfirm={async (visitDate) => {
          if (pending) return;
          setPending(true);
          try {
            const added = await addPlan({
              id: `event:${event.id}`,
              kind: "event",
              title: event.title,
              subtitle: `${formatDate(visitDate)} \u00B7 ${event.venue}`,
              startDate: visitDate,
              endDate: visitDate,
              venue: event.venue,
            });
            if (!added) {
              toast.error("\uC77C\uC815\uC744 \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
              return;
            }
            setVisitDateOpen(false);
            toast.success(
              plannedItem
                ? "\uBC29\uBB38\uC77C\uC744 \uBCC0\uACBD\uD588\uC5B4\uC694."
                : "\uBC29\uBB38 \uACC4\uD68D\uC5D0 \uB2F4\uC558\uC5B4\uC694.",
            );
          } finally {
            setPending(false);
          }
        }}
      />
    </>
  );
}
