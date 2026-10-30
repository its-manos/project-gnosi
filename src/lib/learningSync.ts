import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { readAccountBackup } from "./learningBackup";
import { parseSyncDocument } from "../utils/syncDocument";
import { LearningStore, type SyncTransport } from "../state/LearningStore";
const stores = new Map<string, LearningStore>();
function transport(userId: string): SyncTransport | null {
  const client = supabase; if (!client) return null;
  const account = async () => {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session?.user.id !== userId) throw new Error("account_changed");
  };
  return {
    async pull() {
      await account();
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const { data, error } = await client.from("learning_sync").select("user_id,payload,revision").eq("user_id", userId).abortSignal(controller.signal).maybeSingle();
        if (error) throw error; await account();
        if (!data) return null;
        if (data.user_id !== userId || !Number.isSafeInteger(data.revision) || data.revision < 1) throw new Error("invalid_sync");
        return { doc: parseSyncDocument(data.payload), revision: data.revision };
      } finally { clearTimeout(timeout); }
    },
    async seed() {
      // Only consulted when no v2 sync row exists. Old backups cannot resurrect
      // deletions in an established sync document.
      try { return (await readAccountBackup(client, userId))?.payload ?? null; }
      catch (error) { if (["PGRST205", "42P01"].includes((error as { code?: string })?.code ?? "")) return null; throw error; }
    },
    async push(doc, revision) {
      await account();
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const { error } = await client.rpc("save_learning_sync", { p_payload: doc, p_expected_revision: revision, p_user_id: userId }).abortSignal(controller.signal);
        if (error) throw error;
      } finally { clearTimeout(timeout); }
    },
  };
}
export function getLearningStore(userId: string | null): LearningStore {
  const key = userId ?? "guest";
  let store = stores.get(key);
  if (!store) { store = new LearningStore(userId, AsyncStorage, userId ? transport(userId) : null); stores.set(key, store); }
  return store;
}
