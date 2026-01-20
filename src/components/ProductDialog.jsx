import { Dialog, DialogContent, DialogTitle } from '@stevederico/skateboard-ui/shadcn/ui/dialog';
import ApprovalBadge from './ApprovalBadge';

export default function ProductDialog({ isOpen, onClose, product, ingredientsList, isApproved, errorMessage }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        showCloseButton={false}
        className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 mt-24 flex flex-col bg-background p-6 shadow-lg data-[state=closed]:slide-out-to-bottom-96 data-[state=open]:slide-in-from-bottom-96 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-t-lg rounded-b-none max-w-full sm:max-w-full"
      >
          {errorMessage ? (
            <>
              <DialogTitle className="text-xl font-semibold text-center mb-4">{errorMessage}</DialogTitle>
              <button
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={onClose}
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <div className="relative w-full flex justify-center mb-4">
                <div className="h-64 w-full bg-accent" />
                <img className="w-full object-contain max-h-64 absolute inset-0" src={product.image_url} alt={product.product_name || 'Product image'} />
                <div className="absolute inset-0 bg-white/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {ingredientsList ? <ApprovalBadge isApproved={isApproved} /> : null}
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-xl font-semibold">{product.product_name}</DialogTitle>
              </div>
              <div className="flex flex-wrap mb-4 capitalize">{ingredientsList}</div>
              <div className="mt-6 flex">
                <button
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
