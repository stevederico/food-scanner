import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import { initializeUtilities } from '@stevederico/skateboard-ui/Utilities';
import constants from './constants.json';
import HomeView from './components/HomeView.jsx';
import ScanView from './components/ScanView.jsx';
import DocsView from './components/DocsView.jsx';

// Initialize utilities before creating app
initializeUtilities(constants);

const appRoutes = [
  { path: 'home', element: <HomeView /> },
  { path: 'scan', element: <ScanView /> },
  { path: 'docs', element: <DocsView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'home'
});
