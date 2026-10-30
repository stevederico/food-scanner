import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Dialog, DialogContent, DialogTitle } from '@stevederico/skateboard-ui/shadcn/ui/dialog';
import { Button } from '@stevederico/skateboard-ui/shadcn/ui/button';
import UpgradeSheet, { type UpgradeSheetHandle } from '@stevederico/skateboard-ui/UpgradeSheet';
import { useUser } from '@stevederico/skateboard-ui/Context';
import { getBackendURL, getCSRFToken } from '@stevederico/skateboard-ui/Utilities';
import { fetchProduct, addToRecentScans, extractIngredients } from '../services/ProductService';
import type { Product } from '../services/ProductService';
import { claimScan } from '../services/scanClaim';
import IngredientRenderer, { checkIsApproved } from './IngredientRenderer';
import ApprovalBadge from './ApprovalBadge';

/**
 * Live barcode scanner view backed by the device camera and ZXing.
 *
 * @component
 * @returns Camera scanner with a product result dialog
 */
export default function ScanView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const upgradeSheetRef = useRef<UpgradeSheetHandle>(null);
  // The decoder reports the same barcode on every frame; handle one at a time
  // so a single scan is looked up and charged once, until "Scan Again".
  const isHandlingRef = useRef(false);
  const user = useUser();
  const [ingredientsList, setIngredientsList] = useState("");
  const [product, setProduct] = useState<Product>({ product_name: "", image_url: "" });
  const [open, setOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [upgradeMessage, setUpgradeMessage] = useState("");

  /**
   * Fetch and display a scanned product, or surface an error.
   *
   * A found product counts as one scan: the backend must admit it (free scans
   * left, or an active subscription) before it is shown. When the free scans
   * are gone, scanning pauses and the upgrade sheet opens.
   * @param productID - Decoded barcode value
   */
  async function handleProductScan(productID: string) {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;
    try {
      const product = await fetchProduct(productID);
      const claim = await claimScan({ backendURL: getBackendURL(), getCsrfToken: getCSRFToken });
      if (claim.status === 'upgrade') {
        setUpgradeMessage(claim.message);
        upgradeSheetRef.current?.show();
        return;
      }
      if (claim.status === 'error') {
        throw new Error(claim.message);
      }
      setProduct(product);
      addToRecentScans(product);
      const ingredientsString = extractIngredients(product);
      setIngredientsList(ingredientsString);
      setIsApproved(checkIsApproved(ingredientsString));
      setErrorMessage("");
      setOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Product not found. Try scanning again.");
      setOpen(true);
    }
  }

  /** Begin continuous decoding from the rear camera into the video element. */
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

  /** Clear the last result and resume decoding. */
  function reset() {
    isHandlingRef.current = false;
    setUpgradeMessage("");
    setProduct({ product_name: "", image_url: "" });
    setIngredientsList("");
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
    <div className="relative h-screen w-screen overflow-hidden" data-section-id="barcode-scanner">
      <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" />

      <UpgradeSheet ref={upgradeSheetRef} userEmail={user?.email} />

      {upgradeMessage ? (
        <section
          role="status"
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-lg bg-background p-6 shadow-lg"
        >
          <h2 className="text-center text-lg font-semibold text-balance">{upgradeMessage}</h2>
          <Button size="lg" onClick={() => upgradeSheetRef.current?.show()}>Upgrade</Button>
          <Button size="lg" variant="outline" onClick={reset}>Scan Again</Button>
        </section>
      ) : null}

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}>
        <DialogContent
          showCloseButton={false}
          className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 mt-24 flex flex-col bg-background p-6 shadow-lg data-[state=closed]:slide-out-to-bottom-96 data-[state=open]:slide-in-from-bottom-96 rounded-t-lg rounded-b-none max-w-full sm:max-w-full"
        >
          {errorMessage ? (
            <>
              <DialogTitle className="text-xl font-semibold text-center mb-4">{errorMessage}</DialogTitle>
              <button
                data-umami-event="scan-again-error"
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => { setOpen(false); reset(); }}
              >
                Scan Again
              </button>
            </>
          ) : (
            <>
              <div className="relative w-full flex justify-center mb-4">
                <div className="h-64 w-full bg-background" />
                <img className="w-full object-contain max-h-64 absolute inset-0" src={product.image_url} alt={product.product_name || 'Product image'} />
                <div className="absolute inset-0 bg-white/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {ingredientsList ? <ApprovalBadge isApproved={isApproved} /> : null}
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-xl font-semibold">{product.product_name}</DialogTitle>
              </div>
              <div className="flex flex-wrap mb-4 capitalize">
                <IngredientRenderer ingredients={ingredientsList} />
              </div>
              <div className="mt-6 flex">
                <button
                  data-umami-event="scan-again-success"
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => { setOpen(false); reset(); }}
                >
                  Scan Again
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
