import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEGACY_WELCOME_KEYS, shouldShowWelcome, WELCOME_STORAGE_KEY, ONBOARDING_CATEGORY_KEY, type WelcomePhase, isWelcomePhase } from "../utils/firstRun";

type WelcomeState = { loading: boolean; visible: boolean; replay: boolean; phase: WelcomePhase; categoryId: string | null };

export function useWelcome(userId: string | null, hasActivity: boolean) {
  // Only the first mounted identity determines eligibility. A question answered
  // during onboarding must not close the guide on the next render.
  const [initial] = useState(() => ({ userId, hasActivity }));
  const [state, setState] = useState<WelcomeState>({
    loading: true, visible: false, replay: false, phase: "welcome", categoryId: null,
  });
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    let current = true;
    void (async () => {
      try {
        const [marker, categoryId] = await Promise.all([
          AsyncStorage.getItem(WELCOME_STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_CATEGORY_KEY),
        ]);
        const legacy = marker === null && initial.userId === null && !initial.hasActivity
          ? (await AsyncStorage.multiGet(LEGACY_WELCOME_KEYS)).map(([, value]) => value) : [];
        const visible = shouldShowWelcome(marker, initial.userId, initial.hasActivity, legacy);
        if (current) setState({ loading: false, visible, replay: false,
          phase: isWelcomePhase(marker) ? marker : "welcome", categoryId });
        if (!visible && marker === null) void AsyncStorage.setItem(WELCOME_STORAGE_KEY, "done").catch(() => undefined);
      } catch { if (current) setState(previous => ({ ...previous, loading: false, visible: false })); }
    })();
    return () => { current = false; mounted.current = false; };
  }, [initial]);

  async function advance(phase: WelcomePhase, categoryId?: string): Promise<boolean> {
    if (!mounted.current) return false;
    try {
      if (!state.replay) {
        if (categoryId) await AsyncStorage.setItem(ONBOARDING_CATEGORY_KEY, categoryId);
        // Persist BEFORE showing the next stage so a restart resumes there.
        await AsyncStorage.setItem(WELCOME_STORAGE_KEY, phase);
      }
      if (!mounted.current) return false;
      setState(previous => ({ ...previous, phase, categoryId: categoryId ?? previous.categoryId }));
      return true;
    } catch { return false; }
  }

  async function complete() {
    try {
      await AsyncStorage.setItem(WELCOME_STORAGE_KEY, "done");
      if (!mounted.current) return false;
      setState(previous => ({ ...previous, loading: false, visible: false, replay: false })); return true;
    } catch { return false; }
  }
  async function skip() {
    // The optional guide must never trap someone because its marker failed.
    try { await AsyncStorage.setItem(WELCOME_STORAGE_KEY, "done"); } catch { /* session-only dismissal */ }
    if (!mounted.current) return false;
    setState(previous => ({ ...previous, loading: false, visible: false, replay: false })); return true;
  }
  return { ...state, advance, complete, skip, isCurrent: () => mounted.current,
    open: () => setState(previous => ({ ...previous, loading: false, visible: true, replay: true, phase: "welcome" })) };
}
