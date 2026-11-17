import Header from '@stevederico/skateboard-ui/Header';
import { AlertCircle, BookOpen, CheckCircle, Info, Scan, Search } from '../icons';

export default function DocsView() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header buttonClass="" title="Documentation" />

      <main className="flex-1 px-4 pb-20">
        <section className="mt-6" data-section-id="docs-overview">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="size-5 text-app" />
            <h2 className="text-lg font-semibold text-balance">About Food Scan</h2>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              Food Scan helps you make informed decisions about the food you eat.
              Scan any product barcode or search by name to instantly see ingredient
              analysis and health ratings. Our database identifies potentially harmful
              ingredients so you can choose healthier options.
            </p>
          </div>
        </section>
        <section className="mt-6" data-section-id="docs-how-to-use">
          <div className="flex items-center gap-2 mb-3">
            <Info className="size-5 text-app" />
            <h2 className="text-lg font-semibold text-balance">How to Use</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-accent rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scan className="size-4 text-app" />
                <h3 className="font-medium text-balance">Scanning Barcodes</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Tap the Scan button on the home screen to open the camera.
                Point your device at the product barcode and hold steady.
                The app will automatically detect and analyze the product.
              </p>
            </div>
            <div className="bg-accent rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="size-4 text-app" />
                <h3 className="font-medium text-balance">Searching Products</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Use the search bar on the home screen to find products by name
                or barcode number. Enter a product name like "Cheerios" or
                paste a barcode number directly.
              </p>
            </div>
          </div>
        </section>
        <section className="mt-6" data-section-id="docs-color-guide">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="size-5 text-app" />
            <h2 className="text-lg font-semibold text-balance">Ingredient Color Guide</h2>
          </div>
          <div className="bg-accent rounded-lg p-4 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="size-4 bg-success rounded-full mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-success text-balance">Safe</h3>
                <p className="text-sm">
                  Generally recognized as safe. These ingredients have no known
                  health concerns and are considered healthy or neutral.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-4 bg-warning rounded-full mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-warning text-balance">Caution</h3>
                <p className="text-sm">
                  Use with moderation. These ingredients may have some health
                  concerns or are best consumed in limited quantities.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-4 bg-danger rounded-full mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-danger text-balance">Avoid</h3>
                <p className="text-sm">
                  Best to avoid. These ingredients are associated with potential
                  health risks and are flagged for your awareness.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-6" data-section-id="docs-approval-status">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="size-5 text-app" />
            <h2 className="text-lg font-semibold text-balance">Product Approval</h2>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              Products are marked as "Approved" if they contain no red-flagged
              ingredients. A product with any ingredient rated as "Avoid" will
              be marked as not approved to help you make healthier choices.
            </p>
          </div>
        </section>
        <section className="mt-6 mb-8" data-section-id="docs-about">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="size-5 text-app" />
            <h2 className="text-lg font-semibold text-balance">About Bixby Apps</h2>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-sm leading-relaxed mb-3">
              Food Scan is developed by Bixby Apps, LLC. We build simple,
              useful mobile applications that help people in their daily lives.
            </p>
            <div className="text-sm flex flex-col gap-1">
              <p>
                <span className="font-medium">Website:</span>{' '}
                <a href="https://www.bixbyapps.com" className="text-app underline">
                  www.bixbyapps.com
                </a>
              </p>
              <p>
                <span className="font-medium">Support:</span>{' '}
                <a href="mailto:support@bixbyapps.com" className="text-app underline">
                  support@bixbyapps.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
