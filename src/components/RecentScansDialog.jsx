import * as Dialog from '@radix-ui/react-dialog';
import { Clock, ShoppingBag, X } from 'lucide-react';

export default function RecentScansDialog({ isOpen, onClose, recentScans, onSelectProduct }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="fixed bottom-0 left-0 right-0 mt-24 flex flex-col bg-background p-6 shadow-lg data-[state=closed]:slide-out-to-bottom-96 data-[state=open]:slide-in-from-bottom-96 data-[state=closed]:animate-out data-[state=open]:animate-in max-h-[calc(100vh-6rem)] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Scans
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-full hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent scans yet. Start scanning products!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentScans.map(scan => (
                <button
                  key={scan.id}
                  className="bg-accent rounded-lg p-3 text-left hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => onSelectProduct(scan)}
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
          )}

          <div className="mt-6">
            <button
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
