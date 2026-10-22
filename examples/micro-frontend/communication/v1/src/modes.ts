export type DemoMode = 'snapshot' | 'events-only';
/** A controlled teaching variant, not a URL to arbitrary runnable code. */
export function readDemoMode(search: string): DemoMode {
  return new URLSearchParams(search).get('mode') === 'events-only' ? 'events-only' : 'snapshot';
}
