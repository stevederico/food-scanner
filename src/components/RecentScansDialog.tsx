import { Button } from '@stevederico/skateboard-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogClose } from '@stevederico/skateboard-ui/ui/dialog';
import { Clock, ShoppingBag, X } from '../icons';
import type { RecentScan } from '../services/productService';

interface RecentScansDialogProps {
  
  isOpen: boolean;
  
  onClose: () => void;
  
  recentScans: RecentScan[];
  
  onSelectProduct: (scan: RecentScan) => void;
}

export default function RecentScansDialog({ isOpen, onClose, recentScans, onSelectProduct }: RecentScansDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 mt-24 flex flex-col bg-background p-6 shadow-lg max-h-[calc(100vh-6rem)] overflow-y-auto rounded-t-lg rounded-b-none max-w-full sm:max-w-full"
      >
          <DialogDescription className="sr-only">Products you scanned recently</DialogDescription>
        <div className="flex items-center justify-between mb-6">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Clock className="size-5" />
            Recent Scans
          </DialogTitle>
          <DialogClose aria-label="Close dialog" className="p-2 rounded-full hover:bg-accent">
            <X className="size-5" />
          </DialogClose>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent scans yet. Start scanning products!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4" data-section-id="recent-scans-grid">
            {recentScans.map(scan => (
              <Button
                key={scan.id}
                aria-label={`View ${scan.name}`}
                data-umami-event="select-recent-scan-dialog"
                variant="ghost"
                className="h-auto flex-col items-stretch gap-0 whitespace-normal rounded-lg border-0 bg-accent p-3 text-left font-normal transition-shadow hover:bg-accent hover:ring-2 hover:ring-app active:scale-100"
                onClick={() => onSelectProduct(scan)}
              >
                <div className="w-full h-24 bg-background rounded-md mb-2 overflow-hidden">
                  {scan.image ? (
                    <img
                      src={scan.image}
                      alt={scan.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <ShoppingBag className="size-8 text-app" />
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium truncate">{scan.name}</div>
              </Button>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button
            data-umami-event="recent-scans-dialog-close"
            className="h-auto w-full rounded border-0 bg-app px-4 py-2 font-bold text-app-foreground hover:bg-app-strong active:scale-100"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
