import posterData from "@/data/official-posters.json";
import scheduleReviews from "@/data/official-schedule-reviews.json";

const posters = new Map(posterData.matches.map((poster) => [poster.eventId, poster]));
export function getOfficialPoster(eventId: string) {
  return posters.get(eventId);
}

export function parsePosterSchedule(raw: string): { dates: string[]; issue: string | null } {
  const pattern = /(\d{4})-(\d{2})-(\d{2})(?:\(([일월화수목금토])\))?(?:\s*\d{1,2}:\d{2})?/g;
  const matches = [...raw.matchAll(pattern)];
  const dates: string[] = [];
  if (!matches.length) return { dates, issue: "개최일을 확인할 수 없습니다." };
  for (const match of matches) {
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      (match[4] && "일월화수목금토"[date.getUTCDay()] !== match[4])
    )
      return { dates: [], issue: "날짜 또는 요일이 일치하지 않아 확인이 필요합니다." };
    dates.push(`${match[1]}-${match[2]}-${match[3]}`);
  }
  const remainder = raw.replace(pattern, "").trim();
  if (dates.length === 1 && remainder === "") return { dates, issue: null };
  if (dates.length === 2 && remainder === "-") {
    const start = Date.parse(dates[0]! + "T00:00:00Z");
    const end = Date.parse(dates[1]! + "T00:00:00Z");
    if (end < start || end - start > 366 * 86400000)
      return { dates: [], issue: "공연 기간 확인이 필요합니다." };
    const expanded = [];
    for (let time = start; time <= end; time += 86400000)
      expanded.push(new Date(time).toISOString().slice(0, 10));
    return { dates: expanded, issue: null };
  }
  if (/^(?:\s*\/\s*)+$/.test(remainder)) return { dates: [...new Set(dates)].sort(), issue: null };
  return { dates: [], issue: "복잡한 일정 표기라 확인이 필요합니다." };
}

export function getOfficialSchedule(eventId: string) {
  const poster = getOfficialPoster(eventId);
  const raw = poster?.scheduleRaw ?? "";
  const review = scheduleReviews.reviews.find((item) => item.posterId === poster?.posterId);
  const parsed = review
    ? { dates: [] as string[], issue: review.reason }
    : raw
      ? parsePosterSchedule(raw)
      : { dates: [] as string[], issue: null };
  return { raw, ...parsed };
}
