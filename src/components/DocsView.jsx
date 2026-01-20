import Header from '@stevederico/skateboard-ui/Header';
import DynamicIcon from '@stevederico/skateboard-ui/DynamicIcon';

export default function DocsView() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header buttonClass="" title="Documentation" />

      <main className="flex-1 px-4 pb-20">
        {/* App Overview */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <DynamicIcon name="BookOpen" className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">About Food Scan</h2>
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

        {/* How to Use */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <DynamicIcon name="Info" className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">How to Use</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-accent rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DynamicIcon name="Scan" className="w-4 h-4 text-blue-500" />
                <h3 className="font-medium">Scanning Barcodes</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Tap the Scan button on the home screen to open the camera.
                Point your device at the product barcode and hold steady.
                The app will automatically detect and analyze the product.
              </p>
            </div>
            <div className="bg-accent rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DynamicIcon name="Search" className="w-4 h-4 text-blue-500" />
                <h3 className="font-medium">Searching Products</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Use the search bar on the home screen to find products by name
                or barcode number. Enter a product name like "Cheerios" or
                paste a barcode number directly.
              </p>
            </div>
          </div>
        </section>

        {/* Ingredient Color Guide */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <DynamicIcon name="AlertCircle" className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Ingredient Color Guide</h2>
          </div>
          <div className="bg-accent rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-green-600 dark:text-green-400">Safe</h3>
                <p className="text-sm">
                  Generally recognized as safe. These ingredients have no known
                  health concerns and are considered healthy or neutral.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-yellow-600 dark:text-yellow-400">Caution</h3>
                <p className="text-sm">
                  Use with moderation. These ingredients may have some health
                  concerns or are best consumed in limited quantities.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">Avoid</h3>
                <p className="text-sm">
                  Best to avoid. These ingredients are associated with potential
                  health risks and are flagged for your awareness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Approval Status */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <DynamicIcon name="CheckCircle" className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Product Approval</h2>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              Products are marked as "Approved" if they contain no red-flagged
              ingredients. A product with any ingredient rated as "Avoid" will
              be marked as not approved to help you make healthier choices.
            </p>
          </div>
        </section>

        {/* About Bixby Apps */}
        <section className="mt-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <DynamicIcon name="BookOpen" className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">About Bixby Apps</h2>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <p className="text-sm leading-relaxed mb-3">
              Food Scan is developed by Bixby Apps, LLC. We build simple,
              useful mobile applications that help people in their daily lives.
            </p>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Website:</span>{' '}
                <a href="https://www.bixbyapps.com" className="text-blue-500 underline">
                  www.bixbyapps.com
                </a>
              </p>
              <p>
                <span className="font-medium">Support:</span>{' '}
                <a href="mailto:support@bixbyapps.com" className="text-blue-500 underline">
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
