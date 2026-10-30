import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLearningBackup, type LearningBackup } from "../utils/learningBackup";

export type AccountBackup = { payload: LearningBackup; revision: number; updatedAt: string };
async function requireAccount(client: SupabaseClient, userId: string) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== userId) throw new Error("account_changed");
}
export async function readAccountBackup(client: SupabaseClient, userId: string): Promise<AccountBackup | null> {
  await requireAccount(client, userId);
  const { data, error } = await client.from("learning_backups").select("user_id,payload,revision,updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  await requireAccount(client, userId);
  if (!data) return null;
  if (data.user_id !== userId || !Number.isSafeInteger(data.revision) || data.revision < 1 || typeof data.updated_at !== "string" || !Number.isFinite(Date.parse(data.updated_at))) throw new Error("invalid_backup");
  return { payload: parseLearningBackup(data.payload), revision: data.revision, updatedAt: data.updated_at };
}
export async function saveAccountBackup(client: SupabaseClient, userId: string, payload: LearningBackup, expectedRevision: number): Promise<void> {
  await requireAccount(client, userId);
  const validated = parseLearningBackup(payload);
  const { error } = await client.rpc("save_learning_backup", { p_payload: validated, p_expected_revision: expectedRevision, p_user_id: userId });
  if (error) throw error;
}
