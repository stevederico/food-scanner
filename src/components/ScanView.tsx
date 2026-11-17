import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@stevederico/skateboard-ui/ui/dialog';
import { Button } from '@stevederico/skateboard-ui/ui/button';
import UpgradeSheet, { type UpgradeSheetHandle } from '@stevederico/skateboard-ui/UpgradeSheet';
import { useUser } from '@stevederico/skateboard-ui/Context';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import { addToRecentScans } from '../services/productService';
import { claimScan } from '../services/scanClaim';
import type { RatedIngredient, ScannedProduct } from '../services/scanClaim';
import IngredientRenderer from './IngredientRenderer';
import ApprovalBadge from './ApprovalBadge';

export default function ScanView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const upgradeSheetRef = useRef<UpgradeSheetHandle>(null);
  const isHandlingRef = useRef(false);
  const user = useUser();
  const [ingredients, setIngredients] = useState<RatedIngredient[]>([]);
  const [product, setProduct] = useState<ScannedProduct>({ code: "", product_name: "", image_url: "" });
  const [open, setOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [upgradeMessage, setUpgradeMessage] = useState("");

  
  async function handleProductScan(productID: string) {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;
    const claim = await claimScan({ backendURL: getBackendURL(), getCsrfToken: getCSRFToken }, { code: productID });
    if (claim.status === 'upgrade') {
      setUpgradeMessage(claim.message);
      upgradeSheetRef.current?.show();
      return;
    }
    if (claim.status === 'error') {
      setErrorMessage(claim.message);
      setOpen(true);
      return;
    }
    const { result } = claim;
    setProduct(result.product);
    addToRecentScans(result);
    setIngredients(result.ingredients);
    setIsApproved(result.approved);
    setErrorMessage("");
    setOpen(true);
  }

  
  const startScan = async () => {
    const video = videoRef.current;
    if (readerRef.current && video) {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      await readerRef.current.decodeFromConstraints(constraints, video, (res) => {
        if (res) {
          handleProductScan(res.getText());
        }
      });
    }
  };

  
  function handleReset() {
    isHandlingRef.current = false;
    setUpgradeMessage("");
    setProduct({ code: "", product_name: "", image_url: "" });
    setIngredients([]);
    if (readerRef.current) {
      readerRef.current.reset();
      startScan();
    }
  }

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    startScan();
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  return (
    <div className="relative size-screen overflow-hidden" data-section-id="barcode-scanner">
      <video ref={videoRef} className="size-full object-cover absolute inset-0" />

      <UpgradeSheet ref={upgradeSheetRef} userEmail={user?.email} />

      {upgradeMessage ? (
        <section
          role="status"
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-lg bg-background p-6 shadow-lg"
        >
          <h2 className="text-center text-lg font-semibold text-balance">{upgradeMessage}</h2>
          <Button size="lg" onClick={() => upgradeSheetRef.current?.show()}>Upgrade</Button>
          <Button size="lg" variant="outline" onClick={handleReset}>Scan Again</Button>
        </section>
      ) : null}

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) handleReset();
      }}>
        <DialogContent
          showCloseButton={false}
          className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 mt-24 flex flex-col bg-background p-6 shadow-lg rounded-t-lg rounded-b-none max-w-full sm:max-w-full"
        >
          <DialogDescription className="sr-only">Scanned product details</DialogDescription>
          {errorMessage ? (
            <>
              <DialogTitle className="text-xl font-semibold text-center mb-4">{errorMessage}</DialogTitle>
              <Button
                data-umami-event="scan-again-error"
                className="h-auto w-full rounded border-0 bg-app px-4 py-2 font-bold text-app-foreground hover:bg-app-strong active:scale-100"
                onClick={() => { setOpen(false); handleReset(); }}
              >
                Scan Again
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-full flex justify-center mb-4">
                <div className="h-64 w-full bg-background" />
                {product.image_url ? <img className="w-full object-contain max-h-64 absolute inset-0" src={product.image_url} alt={product.product_name || 'Product image'}/> : null}
                <div className="absolute inset-0 bg-app-foreground/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {ingredients.length ? <ApprovalBadge isApproved={isApproved} /> : null}
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-xl font-semibold">{product.product_name}</DialogTitle>
              </div>
              <div className="flex flex-wrap mb-4 capitalize">
                <IngredientRenderer ingredients={ingredients} />
              </div>
              <div className="mt-6 flex">
                <Button
                  data-umami-event="scan-again-success"
                  className="h-auto w-full rounded border-0 bg-app px-4 py-2 font-bold text-app-foreground hover:bg-app-strong active:scale-100"
                  onClick={() => { setOpen(false); handleReset(); }}
                >
                  Scan Again
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
