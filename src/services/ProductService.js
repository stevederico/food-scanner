const fetchProduct = async (productID) => {
  const response = await fetch(
    `https://us.openfoodfacts.org/api/v3/product/${productID}.json?fields=code,product_name,image_url,ingredients`
  );
  const data = await response.json();
  
  if (data.status === "failure") {
    throw new Error("Product not found");
  }
  
  return data.product;
};

const addToRecentScans = (product) => {
  if (!product?.code) return;
  
  const currentScans = JSON.parse(localStorage.getItem('recentScans') || '[]');
  const newScans = [
    { 
      id: product.code,
      name: product.product_name || 'Unknown Product', 
      image: product.image_url || null,
      timestamp: Date.now()
    },
    ...currentScans.filter(scan => scan.id !== product.code)
  ].slice(0, 10);
  
  localStorage.setItem('recentScans', JSON.stringify(newScans));
  return newScans;
};

export { fetchProduct, addToRecentScans };