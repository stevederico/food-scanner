/// <reference types="vite/client" />

/**
 * Ambient declarations for app-specific globals and aliased imports.
 *
 * - `@root/bad_ingredients.json` resolves via the Vite `@root` alias
 *   (project root) and isn't visible to TypeScript's module resolver, so it
 *   is declared here as an untyped JSON module (consumers cast the shape).
 * - `window.umami` is injected by the Umami analytics script tag in index.html.
 */

declare module '@root/bad_ingredients.json' {
  const value: unknown[];
  export default value;
}

/** Umami analytics global injected by the tracking script. */
interface Umami {
  /** Track a page view, or a named event with optional data. */
  track: (eventName?: string, data?: Record<string, unknown>) => void;
  /** Identify the current user by id (with metadata) or by metadata alone. */
  identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
}

interface Window {
  umami?: Umami;
}
