import { createRoot } from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useEffect, useRef } from 'react';
import './assets/styles.css';
import Layout from '@stevederico/skateboard-ui/Layout';
import LandingView from '@stevederico/skateboard-ui/LandingView';
import TextView from '@stevederico/skateboard-ui/TextView';
import SignUpView from '@stevederico/skateboard-ui/SignUpView';
import SignInView from '@stevederico/skateboard-ui/SignInView';
import SignOutView from '@stevederico/skateboard-ui/SignOutView';
import PaymentView from '@stevederico/skateboard-ui/PaymentView';
import SettingsView from '@stevederico/skateboard-ui/SettingsView';
import NotFound from '@stevederico/skateboard-ui/NotFound';
import { getCurrentUser } from '@stevederico/skateboard-ui/Utilities';
import { ContextProvider, getState } from './context.jsx';
import constants from './constants.json';

import HomeView from './components/HomeView.jsx'
import ScanView from './components/ScanView.jsx'

// Check if user is authenticated via CSRF token
function isAuthenticated() {
  if (constants.noLogin === true) {
    return true;
  }
  const appName = constants.appName || 'food-scan';
  const csrfKey = `${appName.toLowerCase().replace(/\s+/g, '-')}_csrf`;
  return Boolean(localStorage.getItem(csrfKey));
}

// Protected route wrapper
const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/signin" replace />;
};

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = getState();
  const fetchingRef = useRef(false);

  // Set page title and reset dark mode on non-app pages
  useEffect(() => {
    document.title = constants.appName;
    if (!location.pathname.toLowerCase().includes('app')) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [location.pathname]);

  // Fetch user data when entering app routes
  useEffect(() => {
    const isAppRoute = location.pathname.toLowerCase().includes('app');
    if (!isAppRoute || state.user || fetchingRef.current) return;

    const fetchUser = async () => {
      fetchingRef.current = true;
      try {
        const data = await getCurrentUser();
        if (data) {
          dispatch({ type: 'SET_USER', payload: data });
        } else if (!constants.noLogin) {
          navigate('/signin');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        if (!constants.noLogin) {
          navigate('/signin');
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchUser();
  }, [location.pathname, state.user, dispatch, navigate]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/console" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomeView />} />
          <Route path="scan" element={<ScanView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="stripe" element={<PaymentView />} />
        </Route>
      </Route>
      <Route path="/" element={<LandingView />} />
      <Route path="/signin" element={<SignInView />} />
      <Route path="/signup" element={<SignUpView />} />
      <Route path="/signout" element={<SignOutView />} />
      <Route
        path="/terms"
        element={<TextView details={constants.termsOfService} />}
      />
      <Route
        path="/privacy"
        element={<TextView details={constants.privacyPolicy} />}
      />
      <Route path="/eula" element={<TextView details={constants.EULA} />} />
      <Route
        path="/subs"
        element={<TextView details={constants.subscriptionDetails} />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ContextProvider>
    <Router>
      <App />
    </Router>
  </ContextProvider>
);
