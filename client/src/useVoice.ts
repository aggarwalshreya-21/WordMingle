import { useSyncExternalStore } from 'react';
import { voice } from './voice';

/** Subscribe a component to voice-chat state changes. */
export function useVoice() {
  const snapshot = useSyncExternalStore(
    (cb) => voice.subscribe(cb),
    () => voiceSnapshot(),
    () => voiceSnapshot(),
  );
  return snapshot;
}

// Return a stable-ish snapshot object. useSyncExternalStore compares by
// reference, so we memoize on the primitive fields that matter for the UI.
let cache = { active: false, muted: false, error: null as string | null, peerCount: 0 };
function voiceSnapshot() {
  const next = {
    active: voice.active,
    muted: voice.muted,
    error: voice.error,
    peerCount: voice.peers.size,
  };
  if (
    next.active !== cache.active ||
    next.muted !== cache.muted ||
    next.error !== cache.error ||
    next.peerCount !== cache.peerCount
  ) {
    cache = next;
  }
  return cache;
}
