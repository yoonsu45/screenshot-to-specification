import { supabase } from "@/integrations/supabase/client";

export type SavedEventRow = {
  eventId: string;
  visitDate: string;
};

export async function listMyEventSaves(): Promise<SavedEventRow[]> {
  const { data, error } = await supabase
    .from("event_saves")
    .select("event_id, visit_date")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({ eventId: row.event_id, visitDate: row.visit_date }));
}

export async function saveEventForUser(userId: string, eventId: string, visitDate: string) {
  const { error } = await supabase
    .from("event_saves")
    .upsert(
      { user_id: userId, event_id: eventId, visit_date: visitDate },
      { onConflict: "user_id,event_id" },
    );
  if (error) throw error;
}

export async function deleteEventForUser(userId: string, eventId: string) {
  const { error } = await supabase
    .from("event_saves")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);
  if (error) throw error;
}

export async function getEventSaveCounts(eventIds: string[]) {
  if (eventIds.length === 0) return {} as Record<string, number>;

  const { data, error } = await supabase.rpc("get_event_save_counts", {
    p_event_ids: eventIds,
  });
  if (error) throw error;

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    counts[row.event_id] = Number(row.save_count);
    return counts;
  }, {});
}
