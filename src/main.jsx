import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import { initializeUtilities } from '@stevederico/skateboard-ui/Utilities';
import constants from './constants.json';
import HomeView from './components/HomeView.jsx';
import ScanView from './components/ScanView.jsx';

// Initialize utilities before creating app
initializeUtilities(constants);

const appRoutes = [
  { path: 'home', element: <HomeView /> },
  { path: 'scan', element: <ScanView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'home'
});
