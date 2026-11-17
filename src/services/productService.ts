import { parseScanResult, type ScanResult } from './scanClaim';

/**
 * A product saved to the recent-scans list in localStorage.
 *
 * `result` is the rated product the server returned when it was scanned, so
 * reopening a recent scan shows it again without another (paid) scan. Entries
 * saved before 0.20.0 have no `result` and are scanned again on open.
 */
export interface RecentScan {
  id: string;
  name: string;
  image: string | null;
  timestamp: number;
  result?: ScanResult;
}

const MAX_RECENT_SCANS = 10;

/**
 * Read the recent-scans list from localStorage.
 *
 * @returns Stored scans, or an empty array if none/corrupt
 */
const getRecentScans = (): RecentScan[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('recentScans') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem('recentScans');
    return [];
  }
};

/**
 * Add a scan result to the front of the recent-scans list, de-duplicating by code.
 *
 * @param result - Rated product returned by the server
 * @returns The updated recent-scans list (empty on missing code or write failure)
 */
const addToRecentScans = (result: ScanResult): RecentScan[] => {
  const { product } = result;
  if (!product.code) return [];

  try {
    const newScans = [
      {
        id: product.code,
        name: product.product_name || 'Unknown Product',
        image: product.image_url || null,
        timestamp: Date.now(),
        result,
      },
      ...getRecentScans().filter(scan => scan.id !== product.code)
    ].slice(0, MAX_RECENT_SCANS);

    localStorage.setItem('recentScans', JSON.stringify(newScans));
    return newScans;
  } catch (e) {
    console.warn('localStorage write failed:', e);
    return [];
  }
};

/**
 * The stored result of a recent scan, checked like a server answer.
 *
 * @param scan - Recent scan entry from localStorage
 * @returns The result, or null for an entry saved without one
 */
const storedResult = (scan: RecentScan): ScanResult | null => parseScanResult(scan.result);

export { addToRecentScans, getRecentScans, storedResult };
