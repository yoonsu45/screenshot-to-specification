import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CheckInput } from "@/lib/event-service";
import { ALL_FACILITIES_ID } from "@/data/facilities";

export type PlanItem = {
  id: string;
  kind: "event" | "place";
  title: string;
  subtitle: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
};

type Store = {
  facilityId: string;
  setFacilityId: (id: string) => void;
  /** 주변·가는 길의 기준 장소. 대조로 확인된 공연장이 있으면 그것을 사용 */
  anchor: string | null;
  setAnchor: (a: string | null) => void;
  draft: CheckInput;
  setDraft: (d: CheckInput) => void;
  checkOpen: boolean;
  setCheckOpen: (o: boolean) => void;
  plan: PlanItem[];
  addPlan: (item: PlanItem) => void;
  removePlan: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);
const PLAN_KEY = "olpark-plan-v1";
const empty: CheckInput = { title: "", date: "", venue: "" };

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [facilityId, setFacilityId] = useState(ALL_FACILITIES_ID);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [draft, setDraft] = useState<CheckInput>(empty);
  const [checkOpen, setCheckOpen] = useState(false);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLAN_KEY);
      if (raw) setPlan(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan, loaded]);

  const addPlan = useCallback((item: PlanItem) => {
    setPlan((p) => (p.some((x) => x.id === item.id) ? p.map((x) => (x.id === item.id ? item : x)) : [...p, item]));
  }, []);
  const removePlan = useCallback((id: string) => setPlan((p) => p.filter((x) => x.id !== id)), []);

  const value = useMemo(
    () => ({ facilityId, setFacilityId, anchor, setAnchor, draft, setDraft, checkOpen, setCheckOpen, plan, addPlan, removePlan }),
    [facilityId, anchor, draft, checkOpen, plan, addPlan, removePlan],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppStoreProvider missing");
  return v;
}
