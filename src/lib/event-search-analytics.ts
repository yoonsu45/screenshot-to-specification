import { supabase } from "@/integrations/supabase/client";

const SEARCH_SESSION_KEY = "the-check-search-session-id";
let memorySearchSessionId: string | null = null;

export type TopEventSearch = {
  eventId: string;
  searchCount: number;
};

function createUuid() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();

  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function getAnonymousSearchSessionId() {
  if (memorySearchSessionId) return memorySearchSessionId;

  try {
    const stored = window.localStorage.getItem(SEARCH_SESSION_KEY);
    if (stored) {
      memorySearchSessionId = stored;
      return stored;
    }
  } catch {
    // 모바일 PWA에서 저장소가 제한되면 현재 실행 중인 세션 값만 사용한다.
  }

  const sessionId = createUuid();
  memorySearchSessionId = sessionId;
  try {
    window.localStorage.setItem(SEARCH_SESSION_KEY, sessionId);
  } catch {
    // 저장소 사용 불가 여부가 검색 기능 자체를 막아서는 안 된다.
  }
  return sessionId;
}

export async function recordEventSearch(eventId: string) {
  const { error } = await supabase.rpc("record_event_search", {
    p_event_id: eventId,
    p_anonymous_session_id: getAnonymousSearchSessionId(),
  });
  if (error) throw error;
}

export async function getTopEventSearches(): Promise<TopEventSearch[]> {
  const { data, error } = await supabase.rpc("get_top_event_searches");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    eventId: row.event_id,
    searchCount: Number(row.search_count),
  }));
}
