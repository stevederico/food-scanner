# BXFood (Food Scan)

**Watch What You Eat** - A smart food scanning application that helps you make healthier choices by analyzing product ingredients in real-time.

## Overview

BXFood is a React-based web application that enables users to scan barcodes or search for food products to instantly analyze their ingredients. Using data from the Open Food Facts API and a comprehensive local ingredient database, the app color-codes ingredients as safe (green), caution (yellow), or avoid (red), making it easy to identify potentially harmful substances in your food.

## Features

- **🔍 Barcode Scanning** - Use your device camera to scan product barcodes for instant ingredient analysis
- **🔎 Product Search** - Search for products by name or barcode number
- **⚠️ Ingredient Analysis** - Automatic identification of harmful ingredients with health recommendations
- **📊 Color-Coded Results** - Visual indicators (green/yellow/red) based on ingredient safety
- **📱 Recent Scans** - Track your scanning history for easy reference
- **🌓 Dark Mode** - Built-in dark mode support for comfortable viewing

## Tech Stack

### Frontend
- **React 19** - Modern UI library with latest features
- **Vite 7** - Next-generation frontend build tool
- **React Router v7** - Declarative routing for React
- **@stevederico/skateboard-ui** - Custom UI framework for app scaffolding

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **@tailwindcss/vite** - Official Tailwind Vite plugin
- **tailwindcss-animate** - Animation utilities

### Libraries
- **@zxing/library** - Barcode scanning functionality
- **lucide-react** - Beautiful icon set
- **recharts** - Charting library for data visualization
- **@radix-ui/react-dialog** - Accessible dialog components

### Runtime
- **Deno** - Modern JavaScript/TypeScript runtime

## Installation

### Prerequisites
- [Deno](https://deno.land/) installed on your system

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/stevederico/BXFood.git
   cd BXFood
   ```

2. **Install dependencies**
   ```bash
   deno install
   ```

3. **Start the development server**
   ```bash
   deno run start
   # or
   deno run dev
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:5173 (or the port shown in terminal)
   ```

## Usage

### Scanning Products

1. **Via Camera**
   - Click the "Scan" button in the navigation
   - Allow camera permissions when prompted
   - Point your camera at a product barcode
   - The app will automatically scan and analyze the product

2. **Via Search**
   - Enter a product name or barcode number in the search field
   - Click search or press Enter
   - View the analyzed results in the product dialog

### Understanding Results

- **🟢 Green Ingredients** - Safe to consume (baddness_score: 1)
- **🟡 Yellow Ingredients** - Use with caution (baddness_score: 5)
- **🔴 Red Ingredients** - Recommended to avoid (baddness_score: 10)

Products are marked as "Not Approved" if they contain any ingredient with a red rating or baddness_score > 5.

## Project Structure

```
BXFood/
├── src/
│   ├── components/
│   │   ├── HomeView.jsx           # Home page with search and recent scans
│   │   ├── ScanView.jsx            # Camera barcode scanner
│   │   ├── ProductDialog.jsx       # Product details modal
│   │   ├── IngredientRenderer.jsx  # Ingredient color-coding logic
│   │   └── RecentScansDialog.jsx   # Recent scans history
│   ├── services/
│   │   └── ProductService.js       # Open Food Facts API integration
│   ├── assets/
│   │   └── styles.css              # Custom styles and theme variables
│   ├── constants.json              # App configuration
│   └── main.jsx                    # App entry point
├── bad_ingredients.json            # Ingredient safety database (390+ entries)
├── vite.config.js                  # Vite configuration
├── package.json                    # Dependencies
├── CLAUDE.md                       # AI assistant guidance
└── README.md                       # This file
```

## Key Components

### HomeView
The main landing page featuring:
- Product search functionality (by name or barcode)
- Recent scans list
- Quick access to scanner

### ScanView
Camera-based barcode scanner:
- Uses @zxing/library for barcode detection
- Supports multiple barcode formats
- Real-time scanning feedback

### ProductDialog
Modal displaying:
- Product name and image
- Complete ingredient list with color coding
- Approval status
- Individual ingredient descriptions

### IngredientRenderer
Core analysis component:
- Matches ingredients against `bad_ingredients.json`
- Color-codes each ingredient
- Exports `checkIsApproved()` function for product validation

## Data Sources

### Open Food Facts API
- **Endpoint**: `https://us.openfoodfacts.org/api/v2/product/{barcode}`
- **Purpose**: Retrieve product information, images, and ingredient lists
- **License**: Open Database License (ODbL)

### Bad Ingredients Database
Located in `bad_ingredients.json`, this database contains:
- 390+ ingredients
- Color ratings (green/yellow/red)
- Baddness scores (1-10)
- Health descriptions for each ingredient

## Development

### Available Commands

```bash
# Install dependencies
deno install

# Start development server
deno run start
# or
deno run dev

# Build for development
deno run build

# Build for production
deno run prod
```

### Configuration

App settings are stored in `src/constants.json`:
- App name, icon, and tagline
- Navigation routes
- Backend URLs (development and production)
- Subscription details
- Legal documents (Terms, Privacy, EULA)

### Styling

The app uses Tailwind CSS with custom theme variables:
- Defined in `src/assets/styles.css`
- App color: `--color-app`
- Supports dark mode via `bg-background` and `bg-accent` utilities

## API Integration

### Fetching Products

```javascript
import { fetchProduct, addToRecentScans } from './services/ProductService';

// Fetch by barcode
const product = await fetchProduct('123456789');

// Add to recent scans
addToRecentScans(product);
```

### Checking Ingredient Safety

```javascript
import { checkIsApproved } from './components/IngredientRenderer';

const ingredientsString = "water, sugar, citric acid";
const isApproved = checkIsApproved(ingredientsString);
// Returns false if any ingredient is red or has baddness_score > 5
```

## Production Build

The production build includes a custom deployment step:

```bash
deno run prod
```

This command:
1. Builds the app for production
2. Copies the dist folder to `../bixby-proxy/public/food.bixbyapps.com`

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For questions, issues, or feature requests:
- **Email**: support@bixbyapps.com
- **Company**: Bixby Apps, LLC
- **Website**: www.bixbyapps.com

## Acknowledgments

- [Open Food Facts](https://world.openfoodfacts.org/) - Product database and API
- [@zxing/library](https://github.com/zxing-js/library) - Barcode scanning
- [@stevederico/skateboard-ui](https://www.npmjs.com/package/@stevederico/skateboard-ui) - UI framework
- [Lucide Icons](https://lucide.dev/) - Icon set

---

**Made with ❤️ by Bixby Apps, LLC**
