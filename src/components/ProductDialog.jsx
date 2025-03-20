import * as Dialog from '@radix-ui/react-dialog';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ProductDialog({ isOpen, onClose, product, ingredientsList, isApproved, errorMessage }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content onOpenAutoFocus={(event) => event.preventDefault()} className="fixed bottom-0 left-0 right-0 mt-24 flex flex-col bg-background p-6 shadow-lg data-[state=closed]:slide-out-to-bottom-96 data-[state=open]:slide-in-from-bottom-96 data-[state=closed]:animate-out data-[state=open]:animate-in">
          {errorMessage ? (
            <>
              <Dialog.Title className="text-xl font-semibold text-center mb-4">{errorMessage}</Dialog.Title>
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
                <img className="w-full object-contain max-h-64 absolute inset-0" src={product.image_url} alt="Product" />
                <div className="absolute inset-0 bg-white/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {ingredientsList ? (
                    isApproved ? (
                      <div className="flex flex-col items-center">
                        <ThumbsUp className="size-24 text-green-500" />
                        <div className="bg-green-500 px-3 py-2 text-white rounded-full my-4">Approved</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ThumbsDown className="size-24 text-red-500" />
                        <div className="bg-red-500 px-3 py-2 text-white rounded-full my-4">Not Approved</div>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-semibold">{product.product_name}</Dialog.Title>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}