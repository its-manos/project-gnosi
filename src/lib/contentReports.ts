import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReportOutbox } from "../state/ReportOutbox";
import { supabase } from "./supabase";
const stores = new Map<string, ReportOutbox>();
export function getReportOutbox(userId: string | null): ReportOutbox {
  const key = userId ?? "guest";
  let store = stores.get(key);
  if (!store) {
    store = new ReportOutbox(userId, AsyncStorage, async report => {
      const client = supabase;
      if (!client) throw new Error("reports_unavailable");
      const { data, error: authError } = await client.auth.getSession();
      if (authError) throw authError;
      if ((data.session?.user.id ?? null) !== userId) throw new Error("account_changed");
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const { data: accepted, error } = await client.rpc("submit_content_report", { p_report: report, p_user_id: userId }).abortSignal(controller.signal);
        if (error) throw error;
        if (accepted !== true) throw new Error("report_not_acknowledged");
      } finally { clearTimeout(timeout); }
    });
    stores.set(key, store);
  }
  return store;
}
