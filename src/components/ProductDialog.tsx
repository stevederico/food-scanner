import { Button } from '@stevederico/skateboard-ui/ui/button';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@stevederico/skateboard-ui/ui/dialog';
import ApprovalBadge from './ApprovalBadge';
import type { ScannedProduct } from '../services/scanClaim';

interface ProductDialogProps {
  
  isOpen: boolean;
  
  onClose: () => void;
  
  product: ScannedProduct;
  
  ingredientsList: ReactNode;
  
  isApproved: boolean;
  
  errorMessage?: string;
}

export default function ProductDialog({ isOpen, onClose, product, ingredientsList, isApproved, errorMessage }: ProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 mt-24 flex flex-col bg-background p-6 shadow-lg max-h-[calc(100vh-6rem)] overflow-y-auto rounded-t-lg rounded-b-none max-w-full sm:max-w-full"
      >
          <DialogDescription className="sr-only">Product details</DialogDescription>
          {errorMessage ? (
            <>
              <DialogTitle className="text-xl font-semibold text-center mb-4">{errorMessage}</DialogTitle>
              <Button
                data-umami-event="product-try-again"
                className="h-auto w-full rounded border-0 bg-app px-4 py-2 font-bold text-app-foreground hover:bg-app-strong active:scale-100"
                onClick={onClose}
              >
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-full flex justify-center mb-4">
                <div className="h-64 w-full bg-accent" />
                {product.image_url ? <img className="w-full object-contain max-h-64 absolute inset-0" src={product.image_url} alt={product.product_name || 'Product image'}/> : null}
                <div className="absolute inset-0 bg-app-foreground/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {ingredientsList ? <ApprovalBadge isApproved={isApproved} /> : null}
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-xl font-semibold">{product.product_name}</DialogTitle>
              </div>
              <div className="flex flex-wrap mb-4 capitalize">{ingredientsList}</div>
              <div className="mt-6 flex">
                <Button
                  data-umami-event="product-dialog-close"
                  className="h-auto w-full rounded border-0 bg-app px-4 py-2 font-bold text-app-foreground hover:bg-app-strong active:scale-100"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
