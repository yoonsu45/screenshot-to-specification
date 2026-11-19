import { useState } from "react";
import {
  Bookmark,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Plus,
  Ticket,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import type { ParkEvent } from "@/data/events";
import { getFacility } from "@/data/facilities";
import { formatDate, formatRange } from "@/lib/event-service";
import { useAppStore } from "@/lib/app-store";
import { VisitDateDialog } from "@/components/app/VisitDateDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADD_LABEL = "\uB2F4\uAE30";

export function EventCard({
  event,
  showFacility,
  onClick,
}: {
  event: ParkEvent;
  showFacility?: boolean | undefined;
  onClick?: (() => void) | undefined;
}) {
  const facility = getFacility(event.facilityId);
  const { addPlan, removePlan, plan, requireAuth, userEmail, eventSaveCounts } = useAppStore();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [visitDateOpen, setVisitDateOpen] = useState(false);
  const plannedItem = plan.find((item) => item.id === `event:${event.id}`);
  const isAdded = Boolean(plannedItem);

  async function addEvent(visitDate: string) {
    const added = await addPlan({
      id: `event:${event.id}`,
      kind: "event",
      title: event.title,
      subtitle: `${formatDate(visitDate)} · ${event.venue}`,
      startDate: visitDate,
      endDate: visitDate,
      venue: event.venue,
    });
    if (!added) {
      toast.error("일정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setVisitDateOpen(false);
    setDetailsOpen(false);
    toast.success(isAdded ? "방문 예정일을 변경했어요." : "선택한 날짜로 방문 계획에 담았어요.");
  }

  async function toggleBookmark() {
    if (!requireAuth()) return;
    if (isAdded) {
      const removed = await removePlan(`event:${event.id}`);
      if (removed) toast.success("방문 계획에서 뺐어요.");
      else toast.error("일정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setVisitDateOpen(true);
  }

  function openVisitDateDialog() {
    setDetailsOpen(false);
    window.setTimeout(() => {
      if (!userEmail) {
        requireAuth();
        return;
      }
      setVisitDateOpen(true);
    }, 220);
  }

  function openOfficialSite() {
    if (onClick) {
      onClick();
      return;
    }
    if (event.officialUrl) {
      window.open(event.officialUrl, "_blank", "noopener");
      return;
    }
    toast.info("아직 연결된 예매 페이지가 없는 행사예요.");
  }

  return (
    <>
      <article className="flex w-full min-w-0 items-center gap-2 rounded-[1.75rem] bg-card p-3 text-left shadow-card transition hover:-translate-y-0.5 sm:p-4">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
        >
          <img
            src={event.image}
            alt=""
            loading="lazy"
            width={944}
            height={704}
            className="h-24 w-24 shrink-0 rounded-[1.35rem] object-cover sm:h-32 sm:w-40"
          />
          <div className="min-w-0 flex-1 py-1">
            {event.sourceType === "demo" && (
              <span className="mb-2 inline-flex rounded-full bg-brand-orange/10 px-2.5 py-1 text-[11px] font-extrabold text-brand-orange">
                시연용
              </span>
            )}
            <h3 className="mb-3 line-clamp-2 text-xl font-black leading-tight text-primary sm:text-2xl">
              {event.title}
            </h3>
            <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-foreground sm:text-base">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                {formatCompactRange(event)}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground sm:text-base">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">
                {showFacility ? `${facility?.name} · ` : ""}
                {event.venue}
              </span>
            </p>
            <p className="mt-2 flex min-w-0 items-start gap-1.5 text-xs font-bold text-brand-orange sm:text-sm">
              <UsersRound className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">
                {(eventSaveCounts[event.id] ?? 0).toLocaleString("ko-KR")}명이 일정에 담았어요
              </span>
            </p>
          </div>
        </button>
        <button
          type="button"
          aria-label={isAdded ? "방문 계획에서 빼기" : "방문 계획에 담기"}
          onClick={toggleBookmark}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary transition hover:bg-secondary sm:h-12 sm:w-12"
        >
          <Bookmark className={`h-7 w-7 ${isAdded ? "fill-brand-orange text-brand-orange" : ""}`} />
        </button>
      </article>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="break-words text-primary [overflow-wrap:anywhere]">
              {event.title}
            </DialogTitle>
            <DialogDescription className="break-words [overflow-wrap:anywhere]">
              시연용 예시 데이터 · 실제 행사 아님 · {event.category} · {event.venue}
            </DialogDescription>
          </DialogHeader>
          <img
            src={event.image}
            alt={`${event.title} 포스터`}
            className="max-h-[50dvh] min-h-48 w-full rounded-xl bg-muted object-contain"
          />
          <div className="space-y-3 break-words rounded-xl bg-muted/50 p-4 text-sm [overflow-wrap:anywhere]">
            <p className="flex min-w-0 items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">{formatRange(event)}</span>
            </p>
            {event.startTime && (
              <p className="flex min-w-0 items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  {event.startTime}
                  {event.endTime ? ` – ${event.endTime}` : ""}
                </span>
              </p>
            )}
            <p className="flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                {event.venueDetail ?? `${facility?.name ?? event.facilityId} · ${event.venue}`}
                {event.address ? ` · ${event.address}` : ""}
              </span>
            </p>
            {event.admission && (
              <p className="flex min-w-0 items-start gap-2">
                <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">입장: {event.admission}</span>
              </p>
            )}
            {event.description && <p className="text-muted-foreground">{event.description}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={openOfficialSite}
              className="rounded-xl font-bold"
            >
              <ExternalLink />
              티켓링크 예매
            </Button>
            <Button type="button" onClick={openVisitDateDialog} className="rounded-xl font-bold">
              <Plus />
              {isAdded ? "방문일 변경" : ADD_LABEL}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VisitDateDialog
        event={event}
        open={visitDateOpen}
        onOpenChange={setVisitDateOpen}
        initialDate={plannedItem?.startDate}
        onConfirm={addEvent}
      />
    </>
  );
}

function formatCompactRange(event: ParkEvent) {
  return formatRange(event)
    .replace(/^\d{4}\./, "")
    .replace(/\s~\s/g, " – ")
    .replace(/(\d{2}\.\d{2})\((.)\)/g, "$1 ($2)");
}
