/**
 * Application entry point using Skateboard Application Shell Architecture
 *
 * Configures routing and initializes app with skateboard-ui framework.
 * The shell (skateboard-ui) provides:
 * - Routing system with React Router v7
 * - Context/state management
 * - Authentication flow
 * - Common UI components (Header, Footer, UpgradeSheet)
 * - Utility functions (apiRequest, usage tracking)
 *
 * This file only defines:
 * - Custom view components
 * - Route configuration
 * - App constants
 *
 * @see {@link https://github.com/stevederico/skateboard|Skateboard Docs}
 */
import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import constants from './constants.json';
import AnalyticsProvider from './components/AnalyticsProvider.jsx';
import HomeView from './components/HomeView.jsx';
import ScanView from './components/ScanView.jsx';
import DocsView from './components/DocsView.jsx';

const appRoutes = [
  { path: 'home', element: <HomeView /> },
  { path: 'scan', element: <ScanView /> },
  { path: 'docs', element: <DocsView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'home',
  wrapper: AnalyticsProvider
});
