import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_FACILITIES_ID } from "@/data/facilities";
import { events } from "@/data/events";
import officialSnapshot from "@/data/official-events.json";
import {
  authenticateAccount,
  createAccount,
  getCurrentAccount,
  observeAuthAccount,
  signOutAccount,
  type AuthAccount,
  type AuthResult,
} from "@/lib/auth";
import {
  deleteEventForUser,
  getEventSaveCounts,
  listMyEventSaves,
  saveEventForUser,
} from "@/lib/event-saves";
import type { CheckInput } from "@/lib/event-service";

export type PlanItem = {
  dateKind?: "personal" | "event";
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
  anchor: string | null;
  setAnchor: (anchor: string | null) => void;
  draft: CheckInput;
  setDraft: (draft: CheckInput) => void;
  checkOpen: boolean;
  setCheckOpen: (open: boolean) => void;
  plan: PlanItem[];
  addPlan: (item: PlanItem) => Promise<boolean>;
  removePlan: (id: string) => Promise<boolean>;
  eventSaveCounts: Record<string, number>;
  refreshEventSaveCounts: () => Promise<void>;
  userEmail: string | null;
  authLoaded: boolean;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  authPromptOpen: boolean;
  setAuthPromptOpen: (open: boolean) => void;
  requireAuth: () => boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
const emptyDraft: CheckInput = { title: "", date: "", venue: "" };

function placePlanKey(email: string) {
  return `thecheck-place-plan-v1:${encodeURIComponent(email)}`;
}

function eventPlanItem(eventId: string, visitDate: string): PlanItem | null {
  const official = officialSnapshot.events.find((item) => item.id === eventId);
  if (official)
    return {
      id: `event:${official.id}`,
      dateKind: "personal",
      kind: "event",
      title: official.title,
      subtitle: `개인 방문예정일 ${visitDate} · ${official.venue || "장소 확인 불가"} · 공식 개최일 아님`,
      startDate: visitDate,
      endDate: visitDate,
      venue: official.venue || "장소 확인 불가",
    };
  const event = events.find((item) => item.id === eventId);
  if (!event) return null;
  return {
    id: `event:${event.id}`,
    kind: "event",
    title: event.title,
    subtitle: `${visitDate} · ${event.venue}`,
    startDate: visitDate,
    endDate: visitDate,
    venue: event.venue,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [facilityId, setFacilityId] = useState(ALL_FACILITIES_ID);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [draft, setDraft] = useState<CheckInput>(emptyDraft);
  const [checkOpen, setCheckOpen] = useState(false);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loadedPlacePlanKey, setLoadedPlacePlanKey] = useState<string | null>(null);
  const [eventSaveCounts, setEventSaveCounts] = useState<Record<string, number>>({});
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const refreshEventSaveCounts = useCallback(async () => {
    try {
      const ids = [
        ...events.map((event) => event.id),
        ...officialSnapshot.events.map((event) => event.id),
      ];
      const counts = await getEventSaveCounts(ids);
      setEventSaveCounts(Object.fromEntries(ids.map((id) => [id, counts[id] ?? 0])));
    } catch {
      // Counts are supplemental; the rest of the service remains available if they fail.
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getCurrentAccount()
      .then((currentAccount) => {
        if (active) setAccount(currentAccount);
      })
      .finally(() => {
        if (active) setAuthLoaded(true);
      });

    const unsubscribe = observeAuthAccount((currentAccount) => {
      if (!active) return;
      setAccount(currentAccount);
      setAuthLoaded(true);
    });
    void refreshEventSaveCounts();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshEventSaveCounts]);

  useEffect(() => {
    if (!authLoaded) return;
    let active = true;
    setPlan([]);
    setLoadedPlacePlanKey(null);
    if (!account) return;

    const storageKey = placePlanKey(account.email);
    let places: PlanItem[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) places = parsed.filter((item) => item?.kind === "place");
    } catch {
      // Keep an empty place plan when browser storage is unavailable.
    }

    setPlan(places);
    setLoadedPlacePlanKey(storageKey);
    void listMyEventSaves()
      .then((rows) => {
        if (!active) return;
        const eventItems = rows
          .map((row) => eventPlanItem(row.eventId, row.visitDate))
          .filter((item): item is PlanItem => item !== null);
        setPlan([...places, ...eventItems]);
      })
      .catch(() => {
        // The user can retry by signing in again if the cloud plan cannot be loaded.
      });

    return () => {
      active = false;
    };
  }, [account, authLoaded]);

  useEffect(() => {
    if (!account || loadedPlacePlanKey !== placePlanKey(account.email)) return;
    try {
      localStorage.setItem(
        loadedPlacePlanKey,
        JSON.stringify(plan.filter((item) => item.kind === "place")),
      );
    } catch {
      // Places remain usable in memory when browser storage is unavailable.
    }
  }, [account, loadedPlacePlanKey, plan]);

  const requireAuth = useCallback(() => {
    if (account) return true;
    setAuthPromptOpen(true);
    return false;
  }, [account]);

  const addPlan = useCallback(
    async (item: PlanItem) => {
      if (!account) {
        setAuthPromptOpen(true);
        return false;
      }

      const existing = plan.some((entry) => entry.id === item.id);
      if (item.kind === "event") {
        const eventId = item.id.replace(/^event:/, "");
        if (!item.startDate) return false;
        try {
          await saveEventForUser(account.userId, eventId, item.startDate);
        } catch {
          return false;
        }
        if (!existing) {
          setEventSaveCounts((counts) => ({
            ...counts,
            ...(counts[eventId] === undefined ? {} : { [eventId]: counts[eventId] + 1 }),
          }));
        }
      }

      setPlan((current) =>
        current.some((entry) => entry.id === item.id)
          ? current.map((entry) => (entry.id === item.id ? item : entry))
          : [...current, item],
      );
      if (item.kind === "event") void refreshEventSaveCounts();
      return true;
    },
    [account, plan, refreshEventSaveCounts],
  );

  const removePlan = useCallback(
    async (id: string) => {
      if (!account) {
        setAuthPromptOpen(true);
        return false;
      }

      const existing = plan.find((item) => item.id === id);
      if (!existing) return true;
      if (existing.kind === "event") {
        const eventId = id.replace(/^event:/, "");
        try {
          await deleteEventForUser(account.userId, eventId);
        } catch {
          return false;
        }
        setEventSaveCounts((counts) => ({
          ...counts,
          ...(counts[eventId] === undefined ? {} : { [eventId]: Math.max(0, counts[eventId] - 1) }),
        }));
      }

      setPlan((current) => current.filter((item) => item.id !== id));
      if (existing.kind === "event") void refreshEventSaveCounts();
      return true;
    },
    [account, plan, refreshEventSaveCounts],
  );

  const login = useCallback(async (email: string, password: string) => {
    const result = await authenticateAccount(email, password);
    if (result.ok) {
      setAccount({ email: result.email, userId: result.userId });
      setAuthOpen(false);
    }
    return result;
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const result = await createAccount(email, password);
    if (result.ok) {
      setAccount({ email: result.email, userId: result.userId });
      setAuthOpen(false);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await signOutAccount();
    setAccount(null);
    setPlan([]);
  }, []);

  const value = useMemo<Store>(
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
      eventSaveCounts,
      refreshEventSaveCounts,
      userEmail: account?.email ?? null,
      authLoaded,
      authOpen,
      setAuthOpen,
      authPromptOpen,
      setAuthPromptOpen,
      requireAuth,
      login,
      signup,
      logout,
    }),
    [
      facilityId,
      anchor,
      draft,
      checkOpen,
      plan,
      addPlan,
      removePlan,
      eventSaveCounts,
      refreshEventSaveCounts,
      account,
      authLoaded,
      authOpen,
      authPromptOpen,
      requireAuth,
      login,
      signup,
      logout,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("AppStoreProvider missing");
  return value;
}
