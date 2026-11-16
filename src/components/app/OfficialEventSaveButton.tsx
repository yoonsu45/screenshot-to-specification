import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { OfficialRecord } from "@/lib/official-data";
import { getOfficialSchedule } from "@/lib/official-posters";
import { useAppStore } from "@/lib/app-store";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";
import { cn } from "@/lib/utils";

export function OfficialEventSaveButton({
  event,
  className,
}: {
  event: OfficialRecord;
  className?: string;
}) {
  const { addPlan, plan, requireAuth } = useAppStore();
  const [visitDateOpen, setVisitDateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const schedule = getOfficialSchedule(event.id);
  const plannedItem = plan.find((item) => item.id === `event:${event.id}`);
  const venue = event.venue || "장소 확인 불가";

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (requireAuth()) setVisitDateOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-50",
          className,
        )}
      >
        <Plus className="h-4 w-4" />
        {plannedItem ? "방문일 변경" : "담기"}
      </button>

      <VisitDateDialog
        event={{
          title: event.title,
          venue,
          startDate: schedule.dates[0] ?? event.startDate,
          endDate: schedule.dates[schedule.dates.length - 1] ?? event.startDate,
        }}
        open={visitDateOpen}
        onOpenChange={setVisitDateOpen}
        availableDates={schedule.dates.length ? schedule.dates : undefined}
        initialDate={plannedItem?.startDate}
        onConfirm={async (visitDate) => {
          if (pending) return;
          setPending(true);
          try {
            const added = await addPlan({
              ...(schedule.dates.includes(visitDate) ? { dateKind: "event" as const } : {}),
              id: `event:${event.id}`,
              kind: "event",
              title: event.title,
              subtitle: `${visitDate} · ${venue}`,
              startDate: visitDate,
              endDate: visitDate,
              venue,
            });
            if (!added) {
              toast.error("일정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
              return;
            }
            setVisitDateOpen(false);
            toast.success(plannedItem ? "방문일을 변경했어요." : "방문 계획에 담았어요.");
          } finally {
            setPending(false);
          }
        }}
      />
    </>
  );
}
