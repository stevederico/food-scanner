
declare global {
  interface Window {
    umami?: {
      track: (eventName?: string, data?: Record<string, unknown>) => void;
      identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
    };
    dottie?: {
      track: (eventName?: string, data?: Record<string, unknown>) => void;
      identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Wrapper for Umami analytics tracking
 * Safely handles umami not being loaded and sanitizes data
 */

/** Arbitrary key/value payload attached to an analytics event. */
type EventData = Record<string, unknown>;

/** Sanitized payload safe to send to Umami (primitives or stringified values). */
type SanitizedData = Record<string, string | number | boolean>;

/** @returns True if running on localhost — skip all tracking */
const isLocal = (): boolean => ['localhost', '127.0.0.1'].includes(window.location.hostname);

/**
 * Sanitize event data for Umami
 * Ensures data is always a valid object with proper types
 * @param data - Data to sanitize
 * @returns Sanitized data object
 */
const sanitizeEventData = (data: EventData): SanitizedData => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  const sanitized: SanitizedData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || typeof value === 'function') {
      continue;
    }

    if (typeof value === 'number') {
      sanitized[key] = Math.round(value * 10000) / 10000;
    } else if (typeof value === 'string') {
      sanitized[key] = value.substring(0, 500);
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = JSON.stringify(value).substring(0, 500);
    } else if (typeof value === 'object') {
      sanitized[key] = JSON.stringify(value).substring(0, 500);
    } else {
      sanitized[key] = String(value).substring(0, 500);
    }
  }

  return sanitized;
};

/**
 * Track an analytics event
 * @param eventName - Name of the event
 * @param data - Event data (optional)
 */
export const trackEvent = (eventName: string, data: EventData = {}): void => {
  if (isLocal() || typeof window === 'undefined') return;
  const sanitizedData = sanitizeEventData(data);
  try {
    window.umami?.track?.(eventName, sanitizedData);
  } catch (error) {
    console.warn('Umami tracking failed:', error);
  }
  try {
    window.dottie?.track?.(eventName, sanitizedData);
  } catch (error) {
    console.warn('Dottie tracking failed:', error);
  }
};

/**
 * Identify a user for analytics
 * @param userId - User ID
 * @param data - User metadata (optional)
 */
export const identifyUser = (userId: string, data: EventData = {}): void => {
  if (isLocal() || typeof window === 'undefined') return;
  try {
    if (userId) window.umami?.identify?.(userId, data);
    else window.umami?.identify?.(data);
  } catch (error) {
    console.warn('Umami identification failed:', error);
  }
  try {
    if (userId) window.dottie?.identify?.(userId, data);
    else window.dottie?.identify?.(data);
  } catch (error) {
    console.warn('Dottie identification failed:', error);
  }
};

/**
 * Track a page view
 */
export const trackPageView = (): void => {
  if (isLocal() || typeof window === 'undefined') return;
  try {
    window.umami?.track?.();
  } catch (error) {
    console.warn('Umami page view tracking failed:', error);
  }
  try {
    window.dottie?.track?.();
  } catch (error) {
    console.warn('Dottie page view tracking failed:', error);
  }
};
