import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { parseDailyDocument } from "../utils/dailySyncDocument";
import { DailyStore, type DailyTransport } from "../state/DailyStore";
const stores = new Map<string, DailyStore>();
function transport(userId: string): DailyTransport | null {
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
        const { data, error } = await client.from("daily_sync").select("user_id,payload,revision").eq("user_id", userId).abortSignal(controller.signal).maybeSingle();
        if (error) throw error; await account();
        if (!data) return null;
        if (data.user_id !== userId || !Number.isSafeInteger(data.revision) || data.revision < 1) throw new Error("invalid_sync");
        return { doc: parseDailyDocument(data.payload), revision: data.revision };
      } finally { clearTimeout(timeout); }
    },
    async push(doc, revision) {
      await account();
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const { error } = await client.rpc("save_daily_sync", { p_payload: doc, p_expected_revision: revision, p_user_id: userId }).abortSignal(controller.signal);
        if (error) throw error;
      } finally { clearTimeout(timeout); }
    },
  };
}
export function getDailyStore(userId: string | null): DailyStore {
  const key = userId ?? "guest";
  let store = stores.get(key);
  if (!store) { store = new DailyStore(userId, AsyncStorage, userId ? transport(userId) : null); stores.set(key, store); }
  return store;
}
