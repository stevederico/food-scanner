const MAX_RECENT_SCANS = 10;
const API_TIMEOUT = 8000;

const fetchProduct = async (productID) => {
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
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

const getRecentScans = () => {
  try {
    return JSON.parse(localStorage.getItem('recentScans') || '[]');
  } catch {
    localStorage.removeItem('recentScans');
    return [];
  }
};

const addToRecentScans = (product) => {
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

const extractIngredients = (product) => {
  if (!product?.ingredients?.length) return '';
  return product.ingredients
    .filter(i => i?.text)
    .map(i => i.text)
    .join(', ');
};

export { fetchProduct, addToRecentScans, getRecentScans, extractIngredients };
