import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEGACY_WELCOME_KEYS, shouldShowWelcome, WELCOME_STORAGE_KEY } from "../utils/firstRun";
export function useWelcome(userId: string | null, hasActivity: boolean) {
  const [initial] = useState(() => ({ userId, hasActivity }));
  const [state, setState] = useState({ loading: true, visible: false, replay: false });
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    let current = true;
    void (async () => {
      try {
        const marker = await AsyncStorage.getItem(WELCOME_STORAGE_KEY);
        const legacy = marker === null && initial.userId === null && !initial.hasActivity
          ? (await AsyncStorage.multiGet(LEGACY_WELCOME_KEYS)).map(([, value]) => value) : [];
        const visible = shouldShowWelcome(marker, initial.userId, initial.hasActivity, legacy);
        if (current) setState({ loading: false, visible, replay: false });
        if (!visible && marker === null) void AsyncStorage.setItem(WELCOME_STORAGE_KEY, "done").catch(() => undefined);
      } catch { if (current) setState({ loading: false, visible: false, replay: false }); }
    })();
    return () => { current = false; mounted.current = false; };
  }, [initial]);
  async function complete() {
    try {
      await AsyncStorage.setItem(WELCOME_STORAGE_KEY, "done");
      if (!mounted.current) return false;
      setState({ loading: false, visible: false, replay: false }); return true;
    } catch { return false; }
  }
  async function skip() {
    // The tour must never trap someone because its nonessential marker failed.
    try { await AsyncStorage.setItem(WELCOME_STORAGE_KEY, "done"); } catch { /* session-only dismissal */ }
    if (!mounted.current) return false;
    setState({ loading: false, visible: false, replay: false }); return true;
  }
  return { ...state, complete, skip, isCurrent: () => mounted.current, open: () => setState({ loading: false, visible: true, replay: true }) };
}
