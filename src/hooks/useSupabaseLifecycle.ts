import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export function useSupabaseLifecycle() {
  useEffect(() => {
    const client = supabase;
    if (!client || Platform.OS === 'web') return;
    const refresh = (state: string | null | undefined) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', refresh);
    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, []);
}
