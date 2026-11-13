import posterData from "@/data/official-posters.json";

const posters = new Map(posterData.matches.map((poster) => [poster.eventId, poster]));
export function getOfficialPoster(eventId: string) {
  return posters.get(eventId);
}
