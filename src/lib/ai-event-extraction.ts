import { createServerFn } from "@tanstack/react-start";

export type ExtractedEventInfo = {
  title: string;
  date: string;
  venue: string;
  confidence: "high" | "medium" | "low";
};

type GatewayResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export const extractEventFromImage = createServerFn({ method: "POST" })
  .validator((input: { imageDataUrl: string }) => {
    if (!input.imageDataUrl.startsWith("data:image/")) throw new Error("이미지 파일만 분석할 수 있어요.");
    if (input.imageDataUrl.length > 8_000_000) throw new Error("이미지가 너무 커요. 더 작은 이미지를 선택해 주세요.");
    return input;
  })
  .handler(async ({ data }): Promise<ExtractedEventInfo> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("AI 분석 기능이 아직 연결되지 않았어요. Lovable에서 AI 커넥터를 활성화해 주세요.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You extract event information from Korean posters and social media screenshots. Return only valid JSON with no markdown.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "이미지에서 행사 정보를 추출하세요.",
                  "반드시 다음 JSON 형식만 반환하세요:",
                  '{"title":"행사명","date":"YYYY-MM-DD 또는 빈 문자열","venue":"장소 또는 빈 문자열","confidence":"high|medium|low"}',
                  "여러 날짜가 있으면 행사 시작일을 date에 넣으세요.",
                  "이미지에서 확인되지 않는 값은 추측하지 말고 빈 문자열로 두세요.",
                  "한국어와 영어 행사명을 이미지에 적힌 그대로 보존하세요.",
                ].join("\n"),
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    const payload = await response.json() as GatewayResponse;
    if (!response.ok) {
      if (response.status === 402) throw new Error("AI 사용 크레딧이 부족해요. 잠시 후 다시 시도하거나 직접 입력해 주세요.");
      if (response.status === 429) throw new Error("AI 요청이 많아요. 잠시 후 다시 시도해 주세요.");
      throw new Error(payload.error?.message ?? "이미지 분석에 실패했어요.");
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("이미지에서 행사 정보를 찾지 못했어요.");

    const parsed = parseJsonContent(content);
    return {
      title: typeof parsed.title === "string" ? parsed.title.trim() : "",
      date: normalizeDate(parsed.date),
      venue: typeof parsed.venue === "string" ? parsed.venue.trim() : "",
      confidence: parsed.confidence === "high" || parsed.confidence === "medium" ? parsed.confidence : "low",
    };
  });

function parseJsonContent(content: string): Record<string, unknown> {
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI 분석 결과를 읽을 수 없어요.");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : "";
}
