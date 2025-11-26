# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BXFood (Food Scan) is a React-based food scanning app that uses barcode scanning to identify products and analyze their ingredients for health safety. It uses the Open Food Facts API and a local `bad_ingredients.json` database to classify ingredients as safe (green), caution (yellow), or avoid (red).

## Commands

```bash
deno install          # Install dependencies
deno run start        # Start dev server (alias for dev)
deno run build        # Build for development
deno run prod         # Build for production and copy to bixby-proxy
```

## Architecture

### Stack
- React 19 with Vite 7
- @stevederico/skateboard-ui framework for app scaffolding
- Tailwind CSS v4 with @tailwindcss/vite plugin
- @zxing/library for barcode scanning
- react-router-dom v7 for routing

### Key Files
- `src/main.jsx` - App entry, defines routes using skateboard-ui's `createSkateboardApp`
- `src/constants.json` - App configuration (name, routes, backend URLs, legal docs)
- `bad_ingredients.json` - Ingredient database with color/baddness_score ratings
- `vite.config.js` - Extends skateboard-ui's Vite config

### Source Structure
- `src/components/HomeView.jsx` - Home page with search and recent scans
- `src/components/ScanView.jsx` - Camera-based barcode scanner using @zxing
- `src/components/ProductDialog.jsx` - Modal for displaying product details
- `src/components/IngredientRenderer.jsx` - Color-codes ingredients, exports `checkIsApproved()`
- `src/services/ProductService.js` - Fetches from Open Food Facts API, manages localStorage

### Data Flow
1. User scans barcode or searches → `ProductService.fetchProduct()` calls Open Food Facts API
2. Product data returned → ingredients extracted as comma-separated string
3. `IngredientRenderer` matches each ingredient against `bad_ingredients.json`
4. `checkIsApproved()` returns false if any ingredient has color='red' or baddness_score > 5

### Styling
- Uses Tailwind utility classes
- Theme colors: `bg-background`, `bg-accent` for dark mode support
- App color defined in `src/assets/styles.css` via `--color-app`
