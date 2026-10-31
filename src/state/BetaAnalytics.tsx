import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { BetaAnalytics } from '../utils/betaAnalytics';
const Context = createContext<BetaAnalytics | null>(null);
export function BetaAnalyticsProvider({ children }: { children: ReactNode }) {
  const [analytics] = useState(() => new BetaAnalytics({
    storage: AsyncStorage, environment: __DEV__ ? 'development' : 'beta',
    platform: Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'other',
    send: async (events, signal) => {
      if (!supabase) throw new Error('Analytics unavailable');
      const { error } = await supabase.rpc('ingest_beta_events', { events }).abortSignal(signal);
      if (error) throw error;
    },
  }));
  useEffect(() => {
    void analytics.start().then(() => analytics.flush());
    let wasActive = AppState.currentState !== 'background';
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background' && wasActive) { wasActive = false; void analytics.background().then(() => analytics.flush()); }
      else if (state === 'active' && !wasActive) { wasActive = true; void analytics.foreground().then(() => analytics.flush()); }
      // iOS inactive is transitional; notification panels are not exits.
    });
    const interval = setInterval(() => { if (AppState.currentState === 'active') void analytics.flush(); }, 15000);
    return () => { subscription.remove(); clearInterval(interval); };
  }, [analytics]);
  return <Context.Provider value={analytics}>{children}</Context.Provider>;
}
export function useBetaAnalytics() {
  const analytics = useContext(Context);
  if (!analytics) throw new Error('BetaAnalyticsProvider is missing');
  const snapshot = useSyncExternalStore(analytics.subscribe, analytics.getSnapshot, analytics.getSnapshot);
  return { analytics, ...snapshot };
}
