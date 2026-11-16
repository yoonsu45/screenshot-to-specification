import { ExternalLink } from "lucide-react";
import { TICKETLINK_BOOKING_URL } from "@/lib/ticketlink";
import { cn } from "@/lib/utils";

export function TicketlinkBookingButton({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <a
      href={TICKETLINK_BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} 티켓링크 예매 페이지 열기`}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary bg-card px-4 py-2.5 text-sm font-extrabold text-primary transition hover:bg-secondary",
        className,
      )}
    >
      <ExternalLink className="h-4 w-4" />
      티켓링크 예매
    </a>
  );
}
