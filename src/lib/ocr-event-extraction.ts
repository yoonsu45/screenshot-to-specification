import { events } from "@/data/events";
import { ALL_FACILITIES_ID, facilities } from "@/data/facilities";
import { officialEvents } from "@/lib/official-data";

export type OcrConfidence = "high" | "medium" | "low";

export type OcrEventCandidate = {
  eventId: string;
  title: string;
  date: string;
  venue: string;
  score: number;
  sourceType: "official_public_data" | "demo";
};

type RankedOcrEventCandidate = OcrEventCandidate & {
  exactTitle: boolean;
  corroborated: boolean;
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

export type OcrLineObservation = {
  text: string;
  confidence: number;
  height: number;
  top: number;
  imageHeight: number;
};

const bookingPattern = /예매|티켓|ticket|open|오픈|판매|예약/i;
const datePattern = /(?:(20\d{2})\s*[.\-/년]\s*)?(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;
const eventTitlePattern =
  /콘서트|공연|페스티벌|축제|전시|뮤지컬|리사이틀|팬미팅|쇼케이스|라이브|투어|concert|festival|exhibition|musical|recital|fan\s*meeting|showcase|live|tour/i;
const venuePattern =
  /홀|돔|센터|공원|미술관|박물관|극장|아레나|스타디움|체육관|공연장|전시장|광장|마당|대학교|클럽|카페|(?:hall|dome|center|centre|park|museum|theater|theatre|arena|stadium|gallery)\b/i;
const nonTitlePattern =
  /예매|티켓|ticket|open|오픈|문의|주최|주관|후원|가격|입장|관람|시간|일시|장소|venue|place|www\.|https?:|@/i;

export async function extractEventFromImage(
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void,
): Promise<BrowserOcrResult> {
  const { createWorker, PSM } = await import("tesseract.js");
  let recognitionPass = 0;
  let lastProgress = 0;
  const worker = await createWorker(["kor", "eng"], undefined, {
    logger(message) {
      if (typeof message.progress !== "number") return;
      const weightedProgress =
        message.status === "recognizing text"
          ? 15 + recognitionPass * 42.5 + message.progress * 42.5
          : message.progress * 15;
      lastProgress = Math.max(lastProgress, Math.min(99, Math.round(weightedProgress)));
      onProgress?.({
        progress: lastProgress,
        label: translateStatus(message.status),
      });
    },
  });

  try {
    await worker.setParameters({
      // Posters contain isolated text blocks rather than one uniform paragraph.
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    const sourceImage = await loadOcrImage(imageDataUrl);
    const variants: Array<HTMLImageElement | HTMLCanvasElement> = [sourceImage];
    try {
      variants.push(createHighContrastVariant(sourceImage));
    } catch {
      // The original image is still usable if a browser cannot create the enhanced canvas.
    }

    const recognizedTexts: string[] = [];
    const observedLines: OcrLineObservation[] = [];
    for (let index = 0; index < variants.length; index += 1) {
      recognitionPass = index;
      const variant = variants[index]!;
      const result = await worker.recognize(
        variant,
        { rotateAuto: true },
        { text: true, blocks: true },
      );
      recognizedTexts.push(result.data.text);
      observedLines.push(
        ...collectLineObservations(
          result.data.blocks,
          variant instanceof HTMLCanvasElement ? variant.height : variant.naturalHeight,
        ),
      );
    }
    onProgress?.({ progress: 100, label: "인식 결과 정리 중" });
    return parseOcrText(mergeOcrTexts(recognizedTexts), new Date().getFullYear(), observedLines);
  } finally {
    await worker.terminate();
  }
}

function createHighContrastVariant(image: HTMLImageElement) {
  const border = 16;
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth + border * 2;
  canvas.height = image.naturalHeight + border * 2;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas unavailable");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, border, border);

  const pixels = context.getImageData(border, border, image.naturalWidth, image.naturalHeight);
  let luminanceTotal = 0;
  for (let index = 0; index < pixels.data.length; index += 4) {
    luminanceTotal +=
      pixels.data[index]! * 0.299 +
      pixels.data[index + 1]! * 0.587 +
      pixels.data[index + 2]! * 0.114;
  }
  const averageLuminance = luminanceTotal / (pixels.data.length / 4);
  const invert = averageLuminance < 105;

  for (let index = 0; index < pixels.data.length; index += 4) {
    const luminance =
      pixels.data[index]! * 0.299 +
      pixels.data[index + 1]! * 0.587 +
      pixels.data[index + 2]! * 0.114;
    const contrasted = Math.max(0, Math.min(255, 128 + (luminance - 128) * 1.55));
    const value = invert ? 255 - contrasted : contrasted;
    pixels.data[index] = value;
    pixels.data[index + 1] = value;
    pixels.data[index + 2] = value;
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, border, border);
  return canvas;
}

function collectLineObservations(
  blocks: Array<{
    paragraphs: Array<{
      lines: Array<{
        text: string;
        confidence: number;
        bbox: { y0: number; y1: number };
      }>;
    }>;
  }> | null,
  imageHeight: number,
) {
  if (!blocks) return [];
  return blocks.flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.map((line) => ({
        text: line.text.replace(/\s+/g, " ").trim(),
        confidence: line.confidence,
        height: Math.max(0, line.bbox.y1 - line.bbox.y0),
        top: line.bbox.y0,
        imageHeight,
      })),
    ),
  );
}

function loadOcrImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function mergeOcrTexts(texts: string[]) {
  const seen = new Set<string>();
  const lines: string[] = [];

  texts.forEach((text) => {
    text.split(/\r?\n/).forEach((line) => {
      const cleaned = line.replace(/\s+/g, " ").trim();
      const key = normalize(cleaned);
      if (!key || seen.has(key)) return;
      seen.add(key);
      lines.push(cleaned);
    });
  });

  return lines.join("\n");
}

export function parseOcrText(
  rawText: string,
  referenceYear = new Date().getFullYear(),
  observedLines: OcrLineObservation[] = [],
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
    first?.exactTitle && first.score >= 0.82 && (!second || first.score - second.score >= 0.12),
  );
  const title =
    isClearTitle && first
      ? first.title
      : inferTitle(
          lines,
          observedLines,
          venue,
          lines.some((line) => hasDate(line)),
        );
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
      // Missing years must be confirmed by the user, never inferred from today.
      if (!match[1]) return;
      const year = Number(match[1]);
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
      facility.keywords?.forEach((keyword) =>
        aliases.push({ alias: keyword, venue: facility.name }),
      );
    });

  const usableAliases = aliases
    .filter(({ alias }) => normalize(alias).length >= 2)
    .sort((left, right) => normalize(right.alias).length - normalize(left.alias).length);
  const exact = usableAliases.find(({ alias }) => normalizedText.includes(normalize(alias)));
  if (exact) return exact.venue;

  const lines = rawText.split(/\r?\n/).map(normalize).filter(Boolean);
  const fuzzy = usableAliases
    .map((entry) => ({
      ...entry,
      score: Math.max(0, ...lines.map((line) => partialSimilarity(normalize(entry.alias), line))),
    }))
    .sort((left, right) => right.score - left.score)[0];

  if (fuzzy && fuzzy.score >= 0.68) return fuzzy.venue;

  const genericVenue = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^(?:장소|venue|place)\s*[:：-]?\s*/i, "").trim())
    .filter((line) => normalize(line).length >= 2 && normalize(line).length <= 40)
    .find((line) => venuePattern.test(line) && !datePattern.test(line));

  return genericVenue ?? "";
}

function partialSimilarity(needle: string, text: string) {
  if (!needle || !text) return 0;
  if (text.includes(needle)) return 1;
  if (needle.includes(text) && text.length / needle.length >= 0.7) return 0.9;
  const minLength = Math.max(2, needle.length - 1);
  const maxLength = Math.min(text.length, needle.length + 1);
  let best = similarity(needle, text);

  for (let length = minLength; length <= maxLength; length += 1) {
    for (let start = 0; start + length <= text.length; start += 1) {
      best = Math.max(best, similarity(needle, text.slice(start, start + length)));
    }
  }
  return best;
}

function inferTitle(
  lines: string[],
  observedLines: OcrLineObservation[],
  venue: string,
  hasRecognizedDate: boolean,
) {
  const hasEventContext =
    hasRecognizedDate || Boolean(venue) || lines.some((line) => eventTitlePattern.test(line));
  if (!hasEventContext) return "";

  const observations = mergeLineObservations(lines, observedLines);
  const maxHeight = Math.max(1, ...observations.map((line) => line.height));
  const venueKey = normalize(venue);
  const candidates = observations
    .map((line, index) => {
      const text = cleanTitleLine(line.text);
      const normalized = normalize(text);
      const digitCount = (normalized.match(/\d/g) ?? []).length;
      const digitRatio = normalized.length ? digitCount / normalized.length : 1;
      const isVenue = Boolean(
        venueKey && (normalized === venueKey || normalized.includes(venueKey)),
      );
      const invalid =
        normalized.length < 2 ||
        normalized.length > 60 ||
        digitRatio > 0.55 ||
        isVenue ||
        nonTitlePattern.test(text) ||
        isDateLike(text);
      if (invalid) return null;

      const sizeScore = line.height > 0 ? line.height / maxHeight : 0.45;
      const confidenceScore = Math.max(0, Math.min(1, line.confidence / 100));
      const relativeTop = line.imageHeight > 0 ? line.top / line.imageHeight : index / lines.length;
      const positionScore = relativeTop <= 0.65 ? 1 : 0.45;
      const keywordScore = eventTitlePattern.test(text) ? 1 : 0;
      const lengthScore = Math.min(1, normalized.length / 12);
      return {
        text,
        score:
          sizeScore * 0.42 +
          confidenceScore * 0.2 +
          positionScore * 0.16 +
          keywordScore * 0.14 +
          lengthScore * 0.08,
      };
    })
    .filter((candidate): candidate is { text: string; score: number } => candidate !== null)
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  if (!best) return "";
  const minimumScore = observedLines.length ? 0.48 : 0.38;
  return best.score >= minimumScore ? best.text : "";
}

function mergeLineObservations(lines: string[], observations: OcrLineObservation[]) {
  const byText = new Map<string, OcrLineObservation>();
  observations.forEach((line) => {
    const key = normalize(line.text);
    if (!key) return;
    const previous = byText.get(key);
    if (!previous || line.confidence > previous.confidence || line.height > previous.height) {
      byText.set(key, line);
    }
  });

  return lines.map((text, index) => {
    const observed = byText.get(normalize(text));
    return (
      observed ?? {
        text,
        confidence: 55,
        height: 0,
        top: index,
        imageHeight: Math.max(1, lines.length),
      }
    );
  });
}

function cleanTitleLine(value: string) {
  return value
    .replace(/^[\s|·•:：\-–—]+|[\s|·•:：\-–—]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isDateLike(value: string) {
  datePattern.lastIndex = 0;
  if (datePattern.test(value)) return true;
  return /^\s*(?:20\d{2}\s*)?[.\-/년월일\d\s():~]+\s*$/.test(value);
}

function rankEventCandidates(
  lines: string[],
  rawText: string,
  venue: string,
  dates: string[],
): RankedOcrEventCandidate[] {
  const normalizedText = normalizeForTitle(rawText);
  const catalog = [
    ...officialEvents.map((event) => ({
      eventId: event.id,
      title: event.title,
      date: event.startDate ?? "",
      venue: event.venue ?? "",
      sourceType: "official_public_data" as const,
    })),
    ...events.map((event) => ({
      eventId: event.id,
      title: event.title,
      date: event.startDate,
      venue: event.venue,
      sourceType: "demo" as const,
    })),
  ];

  return catalog
    .map((event) => {
      const eventTitle = normalizeForTitle(event.title.replace(/^\[시연용\]\s*/, ""));
      const lineScore = Math.max(
        0,
        ...lines.map((line) => similarity(eventTitle, normalizeForTitle(line))),
      );
      const exactTitle = eventTitle.length >= 3 && normalizedText.includes(eventTitle);
      const venueMatch = Boolean(
        venue && event.venue && normalize(venue) === normalize(event.venue),
      );
      const dateMatch = Boolean(event.date && dates.includes(event.date));
      const corroborated = venueMatch || dateMatch;
      let score = Math.max(lineScore, exactTitle ? 1 : 0);
      if (venueMatch) score += 0.08;
      if (dateMatch) score += 0.08;

      return {
        eventId: event.eventId,
        title: event.title,
        date: event.date,
        venue: event.venue,
        score: Math.min(1, Number(score.toFixed(3))),
        sourceType: event.sourceType,
        exactTitle,
        corroborated,
      };
    })
    .filter(
      (candidate) =>
        candidate.exactTitle ||
        (candidate.sourceType === "official_public_data" &&
          candidate.corroborated &&
          candidate.score >= 0.72),
    )
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
