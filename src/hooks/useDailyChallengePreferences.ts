import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_DAILY_CHALLENGE_PREFERENCES,
  normalizeDailyChallengePreferences,
  parseDailyChallengePreferences,
  type DailyChallengePreferences,
} from "../data/dailyChallengeTopics";

const PREFERENCES_STORAGE_KEY = "@gnosi/daily-challenge-preferences-v1";

export function useDailyChallengePreferences() {
  const [preferences, setPreferences] = useState<DailyChallengePreferences>(
    DEFAULT_DAILY_CHALLENGE_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const saved = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        const parsed = parseDailyChallengePreferences(saved);
        if (isMounted) setPreferences(parsed);
      } catch (error) {
        console.warn("Could not load daily challenge preferences:", error);
        if (isMounted) {
          setPreferences(normalizeDailyChallengePreferences(DEFAULT_DAILY_CHALLENGE_PREFERENCES));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  const savePreferences = useCallback(async (nextPreferences: DailyChallengePreferences) => {
    const normalized = normalizeDailyChallengePreferences(nextPreferences);
    try {
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
      setPreferences(normalized);
      return true;
    } catch (error) {
      console.warn("Could not save daily challenge preferences:", error);
      return false;
    }
  }, []);

  return { preferences, isLoading, savePreferences };
}
