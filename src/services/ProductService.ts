/** A single ingredient entry as returned by the Open Food Facts API. */
export interface ProductIngredient {
  text?: string;
}

/** Product record returned by the Open Food Facts API. */
export interface Product {
  code?: string;
  product_name?: string;
  image_url?: string;
  ingredients?: ProductIngredient[];
}

/** A product saved to the recent-scans list in localStorage. */
export interface RecentScan {
  id: string;
  name: string;
  image: string | null;
  timestamp: number;
}

const MAX_RECENT_SCANS = 10;
const API_TIMEOUT = 8000;

/**
 * Fetch a product by barcode/ID from the Open Food Facts API.
 *
 * @param productID - Product barcode or code
 * @returns The product record
 * @throws If the request times out, fails, or the product is not found
 */
const fetchProduct = async (productID: string): Promise<Product> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `https://us.openfoodfacts.org/api/v3/product/${productID}.json?fields=code,product_name,image_url,ingredients`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "failure" || !data.product) {
      throw new Error("Product not found");
    }

    return data.product;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

/**
 * Read the recent-scans list from localStorage.
 *
 * @returns Stored scans, or an empty array if none/corrupt
 */
const getRecentScans = (): RecentScan[] => {
  try {
    return JSON.parse(localStorage.getItem('recentScans') || '[]');
  } catch {
    localStorage.removeItem('recentScans');
    return [];
  }
};

/**
 * Add a product to the front of the recent-scans list, de-duplicating by code.
 *
 * @param product - Product to record
 * @returns The updated recent-scans list (empty on missing code or write failure)
 */
const addToRecentScans = (product: Product): RecentScan[] => {
  if (!product?.code) return [];

  try {
    const currentScans = getRecentScans();
    const newScans = [
      {
        id: product.code,
        name: product.product_name || 'Unknown Product',
        image: product.image_url || null,
        timestamp: Date.now()
      },
      ...currentScans.filter(scan => scan.id !== product.code)
    ].slice(0, MAX_RECENT_SCANS);

    localStorage.setItem('recentScans', JSON.stringify(newScans));
    return newScans;
  } catch (e) {
    console.warn('localStorage write failed:', e);
    return [];
  }
};

/**
 * Flatten a product's ingredients into a comma-separated string.
 *
 * @param product - Product whose ingredients to extract
 * @returns Comma-separated ingredient names, or '' when none
 */
const extractIngredients = (product: Product): string => {
  if (!product?.ingredients?.length) return '';
  return product.ingredients
    .filter(i => i?.text)
    .map(i => i.text)
    .join(', ');
};

export { fetchProduct, addToRecentScans, getRecentScans, extractIngredients };
