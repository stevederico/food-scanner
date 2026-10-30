0.19.0

  Gate food scans
  Add scan route
  Show upgrade sheet

0.18.0

  Update README versions

0.17.0

  Pin skateboard-ui 5.11.0

0.16.0

  Refetch subscription events
  Store subscription id
  Retry webhook DB errors

0.15.0

  Drop aob from CSP

0.14.0

  Upgrade skateboard 5.6.0
  Replace Hono with zero-crate Rust backend
  Pin skateboard-ui 5.1.0
  Rewrite icons lucide-react
  Split legal json
  Allow camera and Open Food Facts CSP
  Honor DB_TYPE=libsql, copy constants.json, sitemap uses food.bixbyapps.com

0.13.0

  Migrate primary database from MongoDB to SQLite

0.12.0

  Upgrade skateboard to 3.4.0
  Upgrade skateboard-ui to 3.7.0, react to 19.2.6, vite to 8.0.13
  Migrate react-router-dom to react-router, lucide-react to skateboard-ui/icons
  Drop unused deps: @dnd-kit/*, recharts, sonner, zod, next-themes, lucide-react
  Remove use-sync-external-store shim plugin and src/shims/

0.11.0

  Add advanced analytics tracking
  Add AnalyticsProvider wrapper
  Add localhost analytics guard

0.10.0

  Add analytics data-domains

0.9.3

  Update Dockerfile node:22-alpine


- coupons
- add my allgerens to bad ingredients list
- favorites list
- bad ingredients list
- shopping lists
- browse by aisle
- show product possible on search?
- stores on home page
- weird water
- move api requests to backend, move bad_ingredeints to backend too?

0.9.2

  Fix Dockerfile build
  Add .dockerignore
  Add .env.example

0.9.1

  Add railway.json config
  Update Dockerfile Alpine
  Add native module deps
  Remove healthcheck
  Fix crypto import
  Update CSP configuration
  Update prod script

0.9.0

  Add backend workspace
  Add Hono server
  Add multi-database support
  Add documentation directory
  Add Dockerfile
  Add manifest.json
  Update skateboard-ui 1.2.18
  Update CLAUDE.md architecture
  Update README documentation
  Update .gitignore rules
  Remove Claude workflows
  Remove local settings

0.8.1

FIXED: Search on Home now uses us.openfoodfacts.org, ProductDialog has scrolling

0.8.0

  Update dependencies
  Remove context.jsx
  Update vite configuration

0.7.5

  Update dependencies
  Add noLogin configuration flag

0.7.4

  Add tailwindcss-animate plugin
  Remove commented CSS
  Remove unused imports
  Update vite.config.js

0.7.3

  Fix background color mismatch
  Change to pure white background

0.7.2

  Fix vertical scrolling
  Remove overflow hidden

0.7.1

  Add features object
  Add cta field
  Fix LandingView error

0.7.0

  Update skateboard-ui 0.9.6
  Add httpOnly cookies
  Add CSRF protection
  Simplify context.jsx
  Add SignOutView route

0.6.0
* added login back
0.5.0
* handle for ingredeints missing
* 50 recent scans
* US only on homeView
* fixed off by one on recent scans
* header
0.4.0
* added scan history to homeView
* added search by name to HomeView
* added HomeView
* created ProductDialog
* added placeholder to image on ProductDialoag

0.3.0
* handle errors and blank response
* thumbs score on scan
* improved ingredient detection and dialog
0.2.0
* tabbar with action button to scan
* full screen the scanning
* show photo from api response image_front_small_url
* highlight bad ingredients in red ( check ingredients.json)
* show ingredients on screen when received from api, product.ingredients
* added food api
* added scanning



switch for no login
update bg-background and text-foreground insteadl
Feel free to make components to reduce duplicated code
