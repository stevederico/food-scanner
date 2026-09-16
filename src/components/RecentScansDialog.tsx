import { Clock, ShoppingBag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@stevederico/skateboard-ui/shadcn/ui/dialog';
import type { RecentScan } from '../services/ProductService';

/** Props for the RecentScansDialog component. */
interface RecentScansDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when the dialog should close */
  onClose: () => void;
  /** List of recently scanned products */
  recentScans: RecentScan[];
  /** Called with the selected scan when a product is tapped */
  onSelectProduct: (scan: RecentScan) => void;
}

/**
 * Bottom-sheet dialog listing all recent scans in a grid.
 *
 * @component
 * @returns Recent scans dialog
 */
export default function RecentScansDialog({ isOpen, onClose, recentScans, onSelectProduct }: RecentScansDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 mt-24 flex flex-col bg-background p-6 shadow-lg data-[state=closed]:slide-out-to-bottom-96 data-[state=open]:slide-in-from-bottom-96 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-t-lg rounded-b-none max-w-full sm:max-w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Scans
          </DialogTitle>
          <DialogClose aria-label="Close dialog" className="p-2 rounded-full hover:bg-accent">
            <X className="w-5 h-5" />
          </DialogClose>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent scans yet. Start scanning products!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4" data-section-id="recent-scans-grid">
            {recentScans.map(scan => (
              <button
                key={scan.id}
                aria-label={`View ${scan.name}`}
                data-umami-event="select-recent-scan-dialog"
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
            data-umami-event="recent-scans-dialog-close"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
