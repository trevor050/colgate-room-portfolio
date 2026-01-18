export type TrackerPersistMode = 'localStorage' | 'cookie';

export function getTrackerConfig(): { endpoint: string | null; persist: TrackerPersistMode } {
  const endpointRaw = import.meta.env.VITE_TRACKER_ENDPOINT as string | undefined;
  const endpoint = endpointRaw && endpointRaw.trim().length > 0 ? endpointRaw.trim() : null;
  const persistRaw = (import.meta.env.VITE_TRACKER_PERSIST as string | undefined) || 'localStorage';
  const persist: TrackerPersistMode = persistRaw === 'cookie' ? 'cookie' : 'localStorage';
  return { endpoint, persist };
}
