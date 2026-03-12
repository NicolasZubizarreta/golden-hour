import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Import des pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Hub from './pages/Hub';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';

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
        const response = await fetch('http://localhost:3000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
          throw new Error(data.message || 'Session invalide.');
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
          path="/group/:id" 
          element={
            <PrivateRoute isHydratingUser={isHydratingUser}>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
