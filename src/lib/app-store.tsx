import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CheckInput } from "@/lib/event-service";
import { ALL_FACILITIES_ID } from "@/data/facilities";
import { AUTH_SESSION_KEY, authenticateAccount, createAccount, type AuthResult } from "@/lib/auth";

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
  /** 주변·가는 길의 기준 장소. 대조로 확인한 공연장이 있으면 그것을 사용 */
  anchor: string | null;
  setAnchor: (a: string | null) => void;
  draft: CheckInput;
  setDraft: (d: CheckInput) => void;
  checkOpen: boolean;
  setCheckOpen: (o: boolean) => void;
  plan: PlanItem[];
  addPlan: (item: PlanItem) => boolean;
  removePlan: (id: string) => boolean;
  userEmail: string | null;
  authLoaded: boolean;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  requireAuth: () => boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
};

const Ctx = createContext<Store | null>(null);
const empty: CheckInput = { title: "", date: "", venue: "" };

function getPlanKey(email: string) {
  return `thecheck-plan-v2:${encodeURIComponent(email)}`;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [facilityId, setFacilityId] = useState(ALL_FACILITIES_ID);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [draft, setDraft] = useState<CheckInput>(empty);
  const [checkOpen, setCheckOpen] = useState(false);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loadedPlanKey, setLoadedPlanKey] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    try {
      setUserEmail(localStorage.getItem(AUTH_SESSION_KEY));
    } catch {
      setUserEmail(null);
    }
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (!authLoaded) return;

    setPlan([]);
    setLoadedPlanKey(null);
    if (!userEmail) return;

    const planKey = getPlanKey(userEmail);
    try {
      const raw = localStorage.getItem(planKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPlan(parsed);
      }
    } catch {
      // Keep an empty in-memory plan when browser storage is unavailable.
    }
    setLoadedPlanKey(planKey);
  }, [authLoaded, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    const planKey = getPlanKey(userEmail);
    if (loadedPlanKey !== planKey) return;

    try {
      localStorage.setItem(planKey, JSON.stringify(plan));
    } catch {
      // The current session can still use its in-memory plan.
    }
  }, [loadedPlanKey, plan, userEmail]);

  const requireAuth = useCallback(() => {
    if (userEmail) return true;
    setAuthOpen(true);
    return false;
  }, [userEmail]);

  const addPlan = useCallback((item: PlanItem) => {
    if (!userEmail) {
      setAuthOpen(true);
      return false;
    }
    setPlan((current) => current.some((entry) => entry.id === item.id)
      ? current.map((entry) => (entry.id === item.id ? item : entry))
      : [...current, item]);
    return true;
  }, [userEmail]);

  const removePlan = useCallback((id: string) => {
    if (!userEmail) {
      setAuthOpen(true);
      return false;
    }
    setPlan((current) => current.filter((item) => item.id !== id));
    return true;
  }, [userEmail]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authenticateAccount(email, password);
    if (result.ok) {
      setUserEmail(result.email);
      setAuthOpen(false);
    }
    return result;
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const result = await createAccount(email, password);
    if (result.ok) {
      setUserEmail(result.email);
      setAuthOpen(false);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Clear the in-memory session even if storage is unavailable.
    }
    setUserEmail(null);
    setPlan([]);
  }, []);

  const value = useMemo(
    () => ({
      facilityId,
      setFacilityId,
      anchor,
      setAnchor,
      draft,
      setDraft,
      checkOpen,
      setCheckOpen,
      plan,
      addPlan,
      removePlan,
      userEmail,
      authLoaded,
      authOpen,
      setAuthOpen,
      requireAuth,
      login,
      signup,
      logout,
    }),
    [facilityId, anchor, draft, checkOpen, plan, addPlan, removePlan, userEmail, authLoaded, authOpen, requireAuth, login, signup, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("AppStoreProvider missing");
  return value;
}
