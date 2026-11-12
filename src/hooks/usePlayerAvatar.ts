import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getPlayerAvatarStore } from '../state/PlayerAvatar';
export function usePlayerAvatar(userId: string | null) {
  const store = useMemo(() => getPlayerAvatarStore(userId), [userId]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.load(); }, [store]);
  return { ...snapshot, choose: store.choose };
}
