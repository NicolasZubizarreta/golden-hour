import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Import des pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Hub from './pages/Hub';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// --- COMPOSANT DE SÉCURITÉ ---
const PrivateRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
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
            <PrivateRoute>
              <Hub />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;