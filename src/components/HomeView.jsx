import Header from '@stevederico/skateboard-ui/Header';
import { ShoppingBag, Scan, Search, Clock, Store, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductDialog from './ProductDialog';
import { fetchProduct, addToRecentScans } from '../services/ProductService';
import IngredientRenderer, { checkIsApproved } from './IngredientRenderer';

export default function HomeView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState({ product_name: '', image_url: '' });
  const [ingredientsList, setIngredientsList] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentScans');
    if (stored) {
      setRecentScans(JSON.parse(stored));
    }
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    try {
      let product;
      if (searchQuery.match(/^[0-9]+$/)) {
        product = await fetchProduct(searchQuery);
      } else {
        const response = await fetch(
          `https://us.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&json=true&page_size=1`
        );
        const data = await response.json();
        if (data.products?.length > 0) {
          product = await fetchProduct(data.products[0].code);
        } else {
          throw new Error("Product not found");
        }
      }

      setProduct(product);
      const ingredientsString = product.ingredients
        ?.map(ingredient => ingredient.text)
        .join(', ') || '';
      setIngredientsList(ingredientsString);
      setIsApproved(checkIsApproved(ingredientsString));
      setErrorMessage('');
      setIsOpen(true);
      const newScans = addToRecentScans(product);
      setRecentScans(newScans);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Error searching for product. Please try again.");
      setIsOpen(true);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header buttonClass="" title="Welcome" />
      
      <main className="flex-1 px-4 pb-20">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or barcode..."
              className="w-full p-3 pr-12 rounded-lg bg-accent"
            />
            <button type="submit" className="absolute right-3">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="mt-6">
          <Link to="/app/scan" className="flex flex-col items-center justify-center p-6 bg-accent rounded-lg">
            <Scan className="w-8 h-8 text-blue-500 mb-2" />
            <span className="font-medium">Scan Product</span>
          </Link>
        </div>

        {/* Recent Scans */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Scans
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recentScans.map(scan => (
              <button 
                key={scan.id} 
                className="flex-shrink-0 w-32 bg-accent rounded-lg p-3"
                onClick={async () => {
                  try {
                    const product = await fetchProduct(scan.id);
                    setProduct(product);
                    const ingredientsString = product.ingredients
                      ?.map(ingredient => ingredient.text)
                      .join(', ') || '';
                    setIngredientsList(ingredientsString);
                    setIsApproved(checkIsApproved(ingredientsString));
                    setErrorMessage('');
                    setIsOpen(true);
                  } catch (error) {
                    setErrorMessage(error.message);
                    setIsOpen(true);
                  }
                }}
              >
                <div className="w-full h-24 bg-background rounded-md mb-2 overflow-hidden">
                  {scan.image ? (
                    <img 
                      src={scan.image} 
                      alt={scan.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-blue-500" />
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium truncate">{scan.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Healthy Stores */}
        {/* <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              Popular Stores
            </h2>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['Costco', 'Trader Joe\'s', 'Whole Foods'].map(store => (
              <div key={store} className="bg-accent p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-1">
                  <ShoppingBag className="w-6 h-6 text-green-500" />
                  <span className="font-medium">{store}</span>
                </div>
              </div>
            ))}
          </div>
        </div> */}

        {/* Quick Tips */}
        <div className="mt-8 bg-accent rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Ingredients Guide</h2>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Green: Safe & Healthy</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Yellow: Use with Caution</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm">Red: Best to Avoid</span>
            </li>
          </ul>
        </div>
      </main>

      <ProductDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        product={product}
        ingredientsList={<IngredientRenderer ingredients={ingredientsList} />}
        isApproved={isApproved}
        errorMessage={errorMessage}
      />
    </div>
  );
}
