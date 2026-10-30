import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { getDailyStore } from "../lib/dailySync";
import type { DailyStore } from "./DailyStore";
import { getLearningStore } from "../lib/learningSync";
import { colors } from "../theme";
import type { LearningStore } from "./LearningStore";
const Context = createContext<{ store: LearningStore; dailyStore: DailyStore; email: string | null } | null>(null);
export function useLearningSession() {
  const value = useContext(Context);
  if (!value) throw new Error("LearningSession missing");
  return value;
}
export function useLearningSnapshot() {
  const { store } = useLearningSession();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
export function useDailySnapshot() {
  const { dailyStore } = useLearningSession();
  return useSyncExternalStore(dailyStore.subscribe, dailyStore.getSnapshot, dailyStore.getSnapshot);
}
function Loading({ error, retry, guest }: { error?: string; retry?: () => void; guest?: () => void }) {
  return <SafeAreaView style={styles.loading}>
    {error ? <><Text style={styles.text}>{error}</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={retry}><Text style={styles.text}>Δοκίμασε ξανά</Text></Pressable>{guest ? <Pressable accessibilityRole="button" style={styles.retry} onPress={guest}><Text style={styles.text}>Συνέχεια ως επισκέπτης</Text></Pressable> : null}</> : <><ActivityIndicator color={colors.accentLight} /><Text style={styles.text}>Φόρτωση προόδου…</Text></>}
  </SafeAreaView>;
}
function ScopedLearning({ userId, email, children }: { userId: string | null; email: string | null; children: ReactNode }) {
  const [store] = useState(() => getLearningStore(userId));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [dailyStore] = useState(() => getDailyStore(userId));
  const daily = useSyncExternalStore(dailyStore.subscribe, dailyStore.getSnapshot, dailyStore.getSnapshot);
  useEffect(() => {
    void store.start(); void dailyStore.start();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") { void store.retry(); void dailyStore.retry(); } });
    const interval = setInterval(() => { if (AppState.currentState === "active") { void store.sync(); void dailyStore.sync(); } }, 30000);
    return () => { subscription.remove(); clearInterval(interval); store.stop(); dailyStore.stop(); };
  }, [store, dailyStore]);
  if (!snapshot.ready || !daily.ready) return <Loading error={!snapshot.ready ? snapshot.error : daily.error} retry={() => { void store.start(); void dailyStore.start(); }} />;
  return <Context.Provider value={{ store, dailyStore, email }}>{children}</Context.Provider>;
}
/** A keyed boundary remounts all reading/navigation state on account changes. */
export default function LearningSession({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<{ id: string; email: string | null } | null | undefined>(supabase ? undefined : null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const client = supabase; if (!client) return;
    let mounted = true; let received = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      received = true;
      if (mounted) { setIdentity(session ? { id: session.user.id, email: session.user.email ?? null } : null); setError(""); }
    });
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted || received) return;
      if (sessionError) throw sessionError;
      setIdentity(data.session ? { id: data.session.user.id, email: data.session.user.email ?? null } : null);
    }).catch(() => { if (mounted && !received) setError("Δεν φορτώθηκε ο λογαριασμός της συσκευής. Δοκίμασε ξανά."); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [retry]);
  if (identity === undefined) return <Loading error={error} retry={() => { setError(""); setRetry(v => v + 1); }} guest={() => setIdentity(null)} />;
  return <ScopedLearning key={identity?.id ?? "guest"} userId={identity?.id ?? null} email={identity?.email ?? null}>{children}</ScopedLearning>;
}
const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 24, backgroundColor: colors.background },
  text: { color: colors.textBody, fontSize: 15, lineHeight: 24, textAlign: "center" },
  retry: { minHeight: 48, justifyContent: "center", padding: 12, backgroundColor: colors.surface, borderRadius: 12 },
});
