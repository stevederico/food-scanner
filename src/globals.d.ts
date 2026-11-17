interface Umami {
  track: (eventName?: string, data?: Record<string, unknown>) => void;
  identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
}

interface Window {
  umami?: Umami;
  dottie?: { track: (eventName?: string, data?: Record<string, unknown>) => void; identify: (idOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => void };
}
