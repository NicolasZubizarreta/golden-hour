import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import api from './api/axiosConfig';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Hub = lazy(() => import('./pages/Hub'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardMobileSettings = lazy(() => import('./pages/DashboardMobileSettings'));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-golden-bg px-8 text-center font-bold text-golden-muted">
    Chargement...
  </div>
);

// --- COMPOSANT DE SÉCURITÉ ---
const PrivateRoute = ({ children, isHydratingUser }) => {
  const token = useAuthStore((state) => state.token);

  if (token && isHydratingUser) {
    return <div className="p-8 text-center">Chargement de votre session...</div>;
  }

  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [isHydratingUser, setIsHydratingUser] = useState(Boolean(token && !user));

  useEffect(() => {
    let isCancelled = false;

    if (!token || user) {
      setIsHydratingUser(false);
      return () => {};
    }

    const hydrateUser = async () => {
      setIsHydratingUser(true);

      try {
        const { data } = await api.get('/auth/me');

        if (!data.user) {
          throw new Error('Session invalide.');
        }

        if (!isCancelled) {
          setUser(data.user);
        }
      } catch {
        if (!isCancelled) {
          logout();
        }
      } finally {
        if (!isCancelled) {
          setIsHydratingUser(false);
        }
      }
    };

    hydrateUser();

    return () => {
      isCancelled = true;
    };
  }, [logout, setUser, token, user]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Routes privées (protégées) */}
          <Route
            path="/hub"
            element={
              <PrivateRoute isHydratingUser={isHydratingUser}>
                <Hub />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute isHydratingUser={isHydratingUser}>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/group/:id"
            element={
              <PrivateRoute isHydratingUser={isHydratingUser}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/group/:id/mobile-settings"
            element={
              <PrivateRoute isHydratingUser={isHydratingUser}>
                <DashboardMobileSettings />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
