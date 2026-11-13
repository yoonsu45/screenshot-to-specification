import { events, type ParkEvent } from "@/data/events";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ParkingEventNotice = {
  event: ParkEvent;
  daysUntil: number;
  isActiveToday: boolean;
};

export function getParkingEventNotices(
  anchor: string,
  aliases: string[],
  todayKey: string,
  horizonDays = 14,
): ParkingEventNotice[] {
  const venueNames = new Set([anchor, ...aliases]);
  const isWholeOlympicPark = anchor === "올림픽공원";

  return events
    .filter((event) => {
      const matchesDestination = isWholeOlympicPark
        ? event.facilityId === "olympic-park"
        : venueNames.has(event.venue);
      if (!matchesDestination) return false;

      const endDate = event.endDate ?? event.startDate;
      const daysUntilStart = differenceInDays(todayKey, event.startDate);
      return endDate >= todayKey && daysUntilStart <= horizonDays;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)
    .map((event) => ({
      event,
      daysUntil: Math.max(0, differenceInDays(todayKey, event.startDate)),
      isActiveToday: event.startDate <= todayKey && (event.endDate ?? event.startDate) >= todayKey,
    }));
}

export function toKoreaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function differenceInDays(from: string, to: string) {
  return Math.round((dateKeyToUtc(to) - dateKeyToUtc(from)) / DAY_MS);
}

function dateKeyToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year!, month! - 1, day!);
}
