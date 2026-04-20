const STALE_VISIBILITY_MS = 5 * 60 * 1000;

export function getVisibilityFreshCutoff() {
  return new Date(Date.now() - STALE_VISIBILITY_MS);
}
