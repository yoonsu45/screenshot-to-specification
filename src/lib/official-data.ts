import apiData from "@/data/official-events.json";
import posterData from "@/data/official-poster-events.json";

export type OfficialRecord = {
  id: string;
  title: string;
  venue: string | null;
  startDate: string | null;
  sourceRows: number[];
};
export const officialEvents: OfficialRecord[] = [...apiData.events, ...posterData.events];
const posterIds = new Set(posterData.events.map((event) => event.id));
export function officialRecordSource(id: string) {
  return posterIds.has(id) ? "공식 공연 포스터 정보" : "한국체육산업개발 공연정보 Open API";
}
