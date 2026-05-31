import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ownerId = import.meta.env.VITE_PROGRAM_OWNER_ID || "nick";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function loadCloudProgramDays() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("program_days")
    .select("*")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data.map(fromProgramRow);
}

export async function saveCloudProgramDays(days) {
  if (!supabase) return;
  const rows = days.map((day, index) => toProgramRow(day, index));
  const { error } = await supabase.from("program_days").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function clearCloudProgramDays() {
  if (!supabase) return;
  const { error } = await supabase.from("program_days").delete().eq("owner_id", ownerId);
  if (error) throw error;
}

export async function loadCloudSessions() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    date: row.session_date,
    goal: row.title,
    workout: row.workout,
  }));
}

export async function saveCloudSession(session) {
  if (!supabase) return;
  const { error } = await supabase.from("workout_sessions").insert({
    id: String(session.id),
    owner_id: ownerId,
    session_date: session.date,
    title: session.goal,
    workout: session.workout,
  });
  if (error) throw error;
}

function toProgramRow(day, index) {
  return {
    id: String(day.id),
    owner_id: ownerId,
    title: day.title,
    text: day.text,
    image_url: day.mediaUrl || day.imageUrl,
    media_type: day.mediaType || (day.imageUrl ? "image" : ""),
    fingerprint: day.fingerprint || null,
    file_name: day.fileName,
    day_created_at: day.createdAt,
    sort_order: index,
  };
}

function fromProgramRow(row) {
  return {
    id: row.id,
    title: row.title,
    text: row.text || "",
    imageUrl: row.image_url || "",
    mediaUrl: row.image_url || "",
    mediaType: row.media_type || (row.image_url ? "image" : ""),
    fingerprint: row.fingerprint || "",
    fileName: row.file_name || "",
    createdAt: row.day_created_at || "",
  };
}
