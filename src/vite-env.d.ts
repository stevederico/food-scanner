/// <reference types="vite/client" />

/**
 * Ambient declarations for app-specific globals.
 *
 * - `window.umami` is injected by the Umami analytics script tag in index.html.
 */

/** Umami analytics global injected by the tracking script. */
interface Umami {
  /** Track a page view, or a named event with optional data. */
  track: (eventName?: string, data?: Record<string, unknown>) => void;
  /** Identify the current user by id (with metadata) or by metadata alone. */
  identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
}

interface Window {
  umami?: Umami;
  dottie?: { track: (eventName?: string, data?: Record<string, unknown>) => void; identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void };
}
