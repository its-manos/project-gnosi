import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

// No configuration means local-only play. Never crash the learning flow.
export const supabase = url && /^https:\/\/[^/]+/.test(url) && key?.startsWith('sb_publishable_')
  ? createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        storageKey: '@gnosi/supabase-auth-v1',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
