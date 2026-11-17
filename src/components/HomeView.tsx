import { Button } from '@stevederico/skateboard-ui/ui/button';
import { Input } from '@stevederico/skateboard-ui/ui/input';
import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import Header from '@stevederico/skateboard-ui/Header';
import UpgradeSheet, { type UpgradeSheetHandle } from '@stevederico/skateboard-ui/UpgradeSheet';
import { useUser } from '@stevederico/skateboard-ui/Context';
import { getBackendURL, getCSRFToken, useSafeNavigate } from '@stevederico/skateboard-ui/Utilities';
import { ArrowRight, Clock, Info, Scan, Search, ShoppingBag } from '../icons';
import ProductDialog from './ProductDialog';
import RecentScansDialog from './RecentScansDialog';
import { addToRecentScans, storedResult } from '../services/productService';
import type { RecentScan } from '../services/productService';
import { claimScan } from '../services/scanClaim';
import type { RatedIngredient, ScannedProduct, ScanResult, ScanTarget } from '../services/scanClaim';
import IngredientRenderer from './IngredientRenderer';

export default function HomeView() {
  const navigate = useSafeNavigate();
  const user = useUser();
  const upgradeSheetRef = useRef<UpgradeSheetHandle>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<ScannedProduct>({ code: '', product_name: '', image_url: '' });
  const [ingredients, setIngredients] = useState<RatedIngredient[]>([]);
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

  
  function showResult(result: ScanResult) {
    setProduct(result.product);
    setIngredients(result.ingredients);
    setIsApproved(result.approved);
    setErrorMessage('');
    setIsOpen(true);
  }

  
  async function runScan(target: ScanTarget) {
    const claim = await claimScan({ backendURL: getBackendURL(), getCsrfToken: getCSRFToken }, target);
    if (claim.status === 'upgrade') {
      upgradeSheetRef.current?.show();
      return;
    }
    if (claim.status === 'error') {
      setErrorMessage(claim.message);
      setIsOpen(true);
      return;
    }
    showResult(claim.result);
    setRecentScans(addToRecentScans(claim.result));
  }

  
  async function handleSelectRecentScan(scan: RecentScan) {
    setIsRecentScansOpen(false);
    const result = storedResult(scan);
    if (result) {
      showResult(result);
      return;
    }
    await runScan({ code: scan.id });
  }

  
  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    await runScan({ query });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header buttonClass="" title="Welcome" />
      
      <main className="flex-1 px-4 pb-20">
        <div className="mt-6 flex flex-col gap-3" data-section-id="product-search">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-balance">Find a Product</h2>
          <form onSubmit={handleSearch}>
            <div className="relative flex items-center">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search by product name or barcode..."
                aria-label="Search products by name or barcode"
                className="h-auto rounded-xl border-border bg-accent! p-4 pr-14 text-base shadow-none transition-shadow duration-200 md:text-base focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-app"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Search"
                data-umami-event="search-product"
                className="absolute right-2 rounded-lg border-0 bg-app p-2 text-app-foreground transition-transform duration-150 hover:bg-app-strong active:scale-95"
              >
                <Search className="size-5" />
              </Button>
            </div>
          </form>
        </div>
        <div className="mt-8" data-section-id="scan-cta">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app/scan')}
            data-umami-event="scan-product-cta"
            className="group flex h-auto w-full items-center justify-between whitespace-normal rounded-2xl border-0 bg-gradient-to-r from-app to-app-strong p-5 font-normal shadow-lg shadow-app/25 transition-transform duration-200 hover:scale-[1.02] hover:shadow-app/40 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-app-foreground/20 rounded-xl">
                <Scan className="size-7 text-app-foreground" />
              </div>
              <div className="text-left">
                <span className="block text-lg font-semibold text-app-foreground">Scan Product</span>
                <span className="block text-sm text-app-foreground/80">Use camera to scan barcode</span>
              </div>
            </div>
            <ArrowRight className="size-6 text-app-foreground/70 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-app-foreground" />
          </Button>
        </div>
        <div className="mt-10" data-section-id="recent-scans">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 text-balance">
              <Clock className="size-4" />
              Recent Scans
            </h2>
            {recentScans.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setIsRecentScansOpen(true)}
                data-umami-event="view-all-recent-scans"
                className="h-auto gap-1 border-0 p-0 text-sm font-normal text-app transition-colors duration-150 hover:bg-transparent hover:text-app-strong"
              >
                View All
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
            {recentScans.length === 0 ? (
              <div className="w-full py-8 text-center text-muted-foreground">
                <ShoppingBag className="size-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent scans yet</p>
              </div>
            ) : (
              recentScans.map(scan => (
                <Button
                  key={scan.id}
                  variant="ghost"
                  aria-label={`View ${scan.name}`}
                  data-umami-event="select-recent-scan"
                  className="h-auto w-28 flex-shrink-0 flex-col items-stretch gap-0 whitespace-normal rounded-xl border-0 bg-accent p-2.5 font-normal transition-transform duration-150 hover:scale-[1.03] hover:bg-accent active:scale-[0.97]"
                  onClick={() => handleSelectRecentScan(scan)}
                >
                  <div className="w-full h-20 bg-background rounded-lg mb-2 overflow-hidden">
                    {scan.image ? (
                      <img
                        src={scan.image}
                        alt={scan.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <ShoppingBag className="size-7 text-app" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium truncate text-foreground">{scan.name}</div>
                </Button>
              ))
            )}
          </div>
        </div>
        <div className="mt-10 bg-accent rounded-2xl p-5 border border-border" data-section-id="ingredients-guide">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-info/10 rounded-lg">
              <Info className="size-4 text-app" />
            </div>
            <h2 className="text-base font-semibold text-balance">Ingredients Guide</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 bg-success/10 rounded-xl">
              <div className="size-3 bg-success rounded-full mb-2"></div>
              <span className="text-xs font-medium text-success">Safe</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-warning/10 rounded-xl">
              <div className="size-3 bg-warning rounded-full mb-2"></div>
              <span className="text-xs font-medium text-warning">Caution</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-danger/10 rounded-xl">
              <div className="size-3 bg-danger rounded-full mb-2"></div>
              <span className="text-xs font-medium text-danger">Avoid</span>
            </div>
          </div>
        </div>
      </main>

      <UpgradeSheet ref={upgradeSheetRef} userEmail={user?.email} />

      <ProductDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        product={product}
        ingredientsList={<IngredientRenderer ingredients={ingredients} />}
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
