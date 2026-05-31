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
import Layout from '@stevederico/skateboard-ui/Layout';
import constants from './constants.json';
import AnalyticsProvider from './components/AnalyticsProvider.jsx';
import CommandMenu from './components/CommandMenu.jsx';
import HomeView from './components/HomeView.jsx';
import ScanView from './components/ScanView.jsx';
import DocsView from './components/DocsView.jsx';

/**
 * App layout with global command menu overlay.
 *
 * Wraps the default skateboard-ui Layout and injects CommandMenu
 * so the Cmd+K shortcut is available on all authenticated routes.
 *
 * @returns {JSX.Element} Layout with command menu
 */
function AppLayout() {
  return (
    <>
      <CommandMenu />
      <Layout />
    </>
  );
}

const appRoutes = [
  { path: 'home', element: <HomeView /> },
  { path: 'scan', element: <ScanView /> },
  { path: 'docs', element: <DocsView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'home',
  wrapper: AnalyticsProvider,
  overrides: { layout: AppLayout }
});
