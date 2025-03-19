import Header from '@stevederico/skateboard-ui/Header';
import { ShoppingBag, Scan, Search, Clock, Store, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductDialog from './ProductDialog';
import badArray from "@root/bad_ingredients.json"

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

  const addToRecentScans = (product) => {
    if (!product?.code) return;
    
    const newScans = [
      { 
        id: product.code,
        name: product.product_name || 'Unknown Product', 
        image: product.image_url || null,
        timestamp: Date.now()
      },
      ...recentScans.filter(scan => scan.id !== product.code)
    ].slice(0, 10);
    
    setRecentScans(newScans);
    localStorage.setItem('recentScans', JSON.stringify(newScans));
  };

  async function handleSearch(e) {
    e.preventDefault();
    try {
      let data;
      if (searchQuery.match(/^[0-9]+$/)) {
        // If query is numeric, search by barcode
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v3/product/${searchQuery}.json`
        );
        data = await response.json();
      } else {
        // Search by name
        const response = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&json=true&page_size=1`
        );
        data = await response.json();
        if (data.products?.length > 0) {
          data = { status: "success", product: data.products[0] };
        } else {
          data = { status: "failure" };
        }
      }

      if (data.status === "failure") {
        setErrorMessage("Product not found. Try a different search.");
        setIsOpen(true);
        return;
      }

      setProduct(data.product);
      const ingredientsString = data.product.ingredients
        ?.map(ingredient => ingredient.text)
        .join(', ') || '';
      setIngredientsList(ingredientsString);
      setIsApproved(checkIsApproved(ingredientsString));
      setErrorMessage('');
      setIsOpen(true);
      addToRecentScans(data.product);
    } catch (error) {
      console.error(error);
      setErrorMessage("Error searching for product. Please try again.");
      setIsOpen(true);
    }
  }

  function checkIsApproved(ingredients) {
    if (!ingredients) return true;
    const ingredientsArray = ingredients.split(',');
    return !ingredientsArray.some(ing => {
      const cleanIngredient = ing.trim().toLowerCase();
      const match = badArray.find(bad => {
        if (!bad) return false;
        const propertyToUse = bad.name || bad.title;
        if (!propertyToUse) return false;
        const cleanBadName = propertyToUse.toLowerCase().replace(/\([^)]*\)/g, '').trim();
        return cleanIngredient === cleanBadName;
      });
      return match?.color === 'red' || (match?.baddness_score || 0) > 5;
    });
  }

  function renderIngredients(ingredients) {
    if (!ingredients) return null;
    return ingredients.split(',').map((ing, index) => {
      ing = ing.trim();
      const cleanIngredient = ing.toLowerCase().replace(/\([^)]*\)/g, '').trim();
      const ingredient = badArray.find(bad => {
        if (!bad) return false;
        const propertyToUse = bad.name || bad.title;
        if (!propertyToUse) return false;
        const cleanBadName = propertyToUse.toLowerCase().replace(/\([^)]*\)/g, '').trim();
        return cleanIngredient === cleanBadName;
      });
      const colorClasses = {
        red: "text-red-500",
        yellow: "text-yellow-500",
        green: "text-green-500"
      };
      const formattedIngredient = ing.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      return (
        <span key={index} className={`${ingredient ? colorClasses[ingredient.color] : ""} mr-1`}>
          {formattedIngredient},
        </span>
      );
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header buttonClass="" title="BXFood" />
      
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
                onClick={() => {
                  setSearchQuery(scan.id);
                  handleSearch(new Event('submit'));
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
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              Popular Stores
            </h2>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['Whole Foods', 'Trader Joe\'s'].map(store => (
              <div key={store} className="bg-background p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-green-500" />
                  <span className="font-medium">{store}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-accent rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Quick Tips</h2>
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
        ingredientsList={renderIngredients(ingredientsList)}
        isApproved={isApproved}
        errorMessage={errorMessage}
      />
    </div>
  );
}
