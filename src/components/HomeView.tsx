import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, Clock, Info, Scan, Search, ShoppingBag } from 'lucide-react';
import Header from '@stevederico/skateboard-ui/Header';
import UpgradeSheet, { type UpgradeSheetHandle } from '@stevederico/skateboard-ui/UpgradeSheet';
import { useUser } from '@stevederico/skateboard-ui/Context';
import { getBackendURL, getCSRFToken, useSafeNavigate } from '@stevederico/skateboard-ui/Utilities';
import ProductDialog from './ProductDialog';
import RecentScansDialog from './RecentScansDialog';
import { fetchProduct, addToRecentScans, extractIngredients } from '../services/ProductService';
import type { Product, RecentScan } from '../services/ProductService';
import { claimScan } from '../services/scanClaim';
import IngredientRenderer, { checkIsApproved } from './IngredientRenderer';

/**
 * Home view with product search, scan CTA, recent scans, and ingredient guide.
 *
 * @component
 * @returns Home view
 */
export default function HomeView() {
  const navigate = useSafeNavigate();
  const user = useUser();
  const upgradeSheetRef = useRef<UpgradeSheetHandle>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<Product>({ product_name: '', image_url: '' });
  const [ingredientsList, setIngredientsList] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isRecentScansOpen, setIsRecentScansOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentScans');
      if (stored) {
        setRecentScans(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse recent scans:', e);
      localStorage.removeItem('recentScans');
    }
  }, []);

  /**
   * Look up a previously scanned product and open its dialog.
   * @param scan - The recent scan that was selected
   */
  async function handleSelectRecentScan(scan: RecentScan) {
    try {
      const product = await fetchProduct(scan.id);
      setProduct(product);
      const ingredientsString = extractIngredients(product);
      setIngredientsList(ingredientsString);
      setIsApproved(checkIsApproved(ingredientsString));
      setErrorMessage('');
      setIsRecentScansOpen(false);
      setIsOpen(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      setIsRecentScansOpen(false);
      setIsOpen(true);
    }
  }

  /**
   * Search Open Food Facts by barcode or name and open the product dialog.
   *
   * A found product counts as one scan: the backend must admit it (free scans
   * left, or an active subscription) before it is shown. When the free scans
   * are gone the upgrade sheet opens instead.
   * @param e - Form submit event
   */
  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      let product: Product;
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

      const claim = await claimScan({ backendURL: getBackendURL(), getCsrfToken: getCSRFToken });
      if (claim.status === 'upgrade') {
        upgradeSheetRef.current?.show();
        return;
      }
      if (claim.status === 'error') {
        throw new Error(claim.message);
      }

      setProduct(product);
      const ingredientsString = extractIngredients(product);
      setIngredientsList(ingredientsString);
      setIsApproved(checkIsApproved(ingredientsString));
      setErrorMessage('');
      setIsOpen(true);
      const newScans = addToRecentScans(product);
      setRecentScans(newScans);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Error searching for product. Please try again.");
      setIsOpen(true);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header buttonClass="" title="Welcome" />
      
      <main className="flex-1 px-4 pb-20">
        {/* Search Section */}
        <div className="mt-6 space-y-3" data-section-id="product-search">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Find a Product</h2>
          <form onSubmit={handleSearch}>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search by product name or barcode..."
                aria-label="Search products by name or barcode"
                className="w-full p-4 pr-14 rounded-xl bg-accent border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="submit"
                aria-label="Search"
                data-umami-event="search-product"
                className="absolute right-2 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all duration-150"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Scan Button - Primary CTA */}
        <div className="mt-8" data-section-id="scan-cta">
          <button
            type="button"
            onClick={() => navigate('/app/scan')}
            data-umami-event="scan-product-cta"
            className="group w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Scan className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-lg font-semibold text-white">Scan Product</span>
                <span className="block text-sm text-blue-100">Use camera to scan barcode</span>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
          </button>
        </div>

        {/* Recent Scans */}
        <div className="mt-10" data-section-id="recent-scans">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Scans
            </h2>
            {recentScans.length > 0 && (
              <button
                onClick={() => setIsRecentScansOpen(true)}
                data-umami-event="view-all-recent-scans"
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors duration-150"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {recentScans.length === 0 ? (
              <div className="w-full py-8 text-center text-gray-400 dark:text-gray-500">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent scans yet</p>
              </div>
            ) : (
              recentScans.map(scan => (
                <button
                  key={scan.id}
                  aria-label={`View ${scan.name}`}
                  data-umami-event="select-recent-scan"
                  className="flex-shrink-0 w-28 bg-accent rounded-xl p-2.5 hover:scale-[1.03] active:scale-[0.97] transition-transform duration-150"
                  onClick={() => handleSelectRecentScan(scan)}
                >
                  <div className="w-full h-20 bg-background rounded-lg mb-2 overflow-hidden">
                    {scan.image ? (
                      <img
                        src={scan.image}
                        alt={scan.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium truncate text-gray-700 dark:text-gray-300">{scan.name}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ingredients Guide */}
        <div className="mt-10 bg-accent rounded-2xl p-5 border border-gray-200 dark:border-gray-700" data-section-id="ingredients-guide">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Info className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-base font-semibold">Ingredients Guide</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mb-2"></div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Safe</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mb-2"></div>
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Caution</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="w-3 h-3 bg-red-500 rounded-full mb-2"></div>
              <span className="text-xs font-medium text-red-700 dark:text-red-400">Avoid</span>
            </div>
          </div>
        </div>
      </main>

      <UpgradeSheet ref={upgradeSheetRef} userEmail={user?.email} />

      <ProductDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        product={product}
        ingredientsList={<IngredientRenderer ingredients={ingredientsList} />}
        isApproved={isApproved}
        errorMessage={errorMessage}
      />

      <RecentScansDialog
        isOpen={isRecentScansOpen}
        onClose={() => setIsRecentScansOpen(false)}
        recentScans={recentScans}
        onSelectProduct={handleSelectRecentScan}
      />
    </div>
  );
}
