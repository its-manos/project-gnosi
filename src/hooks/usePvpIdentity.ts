import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { PvpIdentityStore } from "../state/PvpIdentity";
const stores = new Map<string, PvpIdentityStore>();
export function usePvpIdentity(userId: string | null) {
  const store = useMemo(() => {
    const key = `@gnosi/pvp-name/v1/${userId ? `account:${userId}` : "guest"}`;
    let value = stores.get(key);
    if (!value) { value = new PvpIdentityStore(AsyncStorage, key); stores.set(key, value); }
    return value;
  }, [userId]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.load(); }, [store]);
  return { ...snapshot, choose: store.choose, retry: store.load };
}
