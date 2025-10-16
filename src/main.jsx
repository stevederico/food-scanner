import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import constants from './constants.json';
import HomeView from './components/HomeView.jsx';
import ScanView from './components/ScanView.jsx';

const appRoutes = [
  { path: 'home', element: <HomeView /> },
  { path: 'scan', element: <ScanView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'home'
});
