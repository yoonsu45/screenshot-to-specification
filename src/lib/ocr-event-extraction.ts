import { events } from "@/data/events";
import { ALL_FACILITIES_ID, facilities } from "@/data/facilities";

export type OcrConfidence = "high" | "medium" | "low";

export type OcrEventCandidate = {
  eventId: string;
  title: string;
  date: string;
  venue: string;
  score: number;
};

export type BrowserOcrResult = {
  rawText: string;
  title: string;
  date: string;
  venue: string;
  confidence: OcrConfidence;
  candidates: OcrEventCandidate[];
  detectedDates: string[];
  bookingDates: string[];
};

export type OcrProgress = {
  progress: number;
  label: string;
};

const bookingPattern = /예매|티켓|ticket|open|오픈|판매|예약/i;
const datePattern = /(?:(20\d{2})\s*[.\-/년]\s*)?(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;

export async function extractEventFromImage(
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void,
): Promise<BrowserOcrResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["kor", "eng"], undefined, {
    logger(message) {
      if (typeof message.progress !== "number") return;
      onProgress?.({
        progress: Math.round(message.progress * 100),
        label: translateStatus(message.status),
      });
    },
  });

  try {
    const result = await worker.recognize(imageDataUrl, { rotateAuto: true });
    return parseOcrText(result.data.text);
  } finally {
    await worker.terminate();
  }
}

export function parseOcrText(
  rawText: string,
  referenceYear = new Date().getFullYear(),
): BrowserOcrResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const dateMatches = extractDates(lines, referenceYear);
  const detectedDates = unique(
    dateMatches.filter((match) => !match.booking).map((match) => match.value),
  );
  const bookingDates = unique(
    dateMatches.filter((match) => match.booking).map((match) => match.value),
  );
  const venue = findVenue(rawText);
  const candidates = rankEventCandidates(lines, rawText, venue, detectedDates);
  const first = candidates[0];
  const second = candidates[1];
  const isClearTitle = Boolean(
    first && first.score >= 0.56 && (!second || first.score - second.score >= 0.08),
  );
  const title = isClearTitle && first ? first.title : "";
  const date = detectedDates[0] ?? "";
  const foundFieldCount = [title, date, venue].filter(Boolean).length;
  const confidence: OcrConfidence =
    first && first.score >= 0.78 && foundFieldCount >= 2
      ? "high"
      : (first && first.score >= 0.42) || foundFieldCount >= 2
        ? "medium"
        : "low";

  return {
    rawText,
    title,
    date,
    venue,
    confidence,
    candidates,
    detectedDates,
    bookingDates,
  };
}

function extractDates(lines: string[], referenceYear: number) {
  const matches: Array<{ value: string; booking: boolean }> = [];

  lines.forEach((line, index) => {
    datePattern.lastIndex = 0;
    const ownMatches = [...line.matchAll(datePattern)];
    if (!ownMatches.length) return;

    const previous = lines[index - 1] ?? "";
    const next = lines[index + 1] ?? "";
    const adjacentBookingLabel = [previous, next].some(
      (candidate) => bookingPattern.test(candidate) && !hasDate(candidate),
    );
    const booking = bookingPattern.test(line) || adjacentBookingLabel;

    ownMatches.forEach((match) => {
      const year = Number(match[1] || referenceYear);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (!isValidDate(year, month, day)) return;
      matches.push({
        value: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        booking,
      });
    });
  });

  return matches;
}

function hasDate(value: string) {
  datePattern.lastIndex = 0;
  return datePattern.test(value);
}

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function findVenue(rawText: string) {
  const normalizedText = normalize(rawText);
  const aliases: Array<{ alias: string; venue: string }> = [];

  events.forEach((event) => aliases.push({ alias: event.venue, venue: event.venue }));
  facilities
    .filter((facility) => facility.id !== ALL_FACILITIES_ID)
    .forEach((facility) => {
      aliases.push({ alias: facility.name, venue: facility.name });
      facility.keywords?.forEach((keyword) => aliases.push({ alias: keyword, venue: keyword }));
    });

  return (
    aliases
      .filter(({ alias }) => normalize(alias).length >= 2)
      .sort((left, right) => normalize(right.alias).length - normalize(left.alias).length)
      .find(({ alias }) => normalizedText.includes(normalize(alias)))?.venue ?? ""
  );
}

function rankEventCandidates(
  lines: string[],
  rawText: string,
  venue: string,
  dates: string[],
): OcrEventCandidate[] {
  const normalizedText = normalizeForTitle(rawText);
  return events
    .map((event) => {
      const eventTitle = normalizeForTitle(event.title);
      const lineScore = Math.max(
        0,
        ...lines.map((line) => similarity(eventTitle, normalizeForTitle(line))),
      );
      const textScore = normalizedText.includes(eventTitle)
        ? 1
        : similarity(eventTitle, normalizedText);
      let score = Math.max(lineScore, textScore);
      if (venue && normalize(venue) === normalize(event.venue)) score += 0.08;
      if (dates.includes(event.startDate)) score += 0.08;

      return {
        eventId: event.id,
        title: event.title,
        date: event.startDate,
        venue: event.venue,
        score: Math.min(1, Number(score.toFixed(3))),
      };
    })
    .filter((candidate) => candidate.score >= 0.18)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

function similarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right || right.includes(left)) return 1;
  if (left.length === 1 || right.length === 1) return left === right ? 1 : 0;

  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  const rightCounts = new Map<string, number>();
  rightPairs.forEach((pair) => rightCounts.set(pair, (rightCounts.get(pair) ?? 0) + 1));
  let intersection = 0;
  leftPairs.forEach((pair) => {
    const count = rightCounts.get(pair) ?? 0;
    if (!count) return;
    intersection += 1;
    rightCounts.set(pair, count - 1);
  });
  return (2 * intersection) / (leftPairs.length + rightPairs.length);
}

function bigrams(value: string) {
  return Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2));
}

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]/g, "");
}

function normalizeForTitle(value: string) {
  return normalize(value).replace(/0/g, "o").replace(/1/g, "i");
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function translateStatus(status: string) {
  const labels: Record<string, string> = {
    "loading tesseract core": "OCR 엔진 준비 중",
    "initializing tesseract": "글자 인식 준비 중",
    "loading language traineddata": "한글·영문 데이터 준비 중",
    "initializing api": "OCR 초기화 중",
    "recognizing text": "이미지의 글자를 읽는 중",
  };
  return labels[status] ?? "이미지를 분석하는 중";
}
