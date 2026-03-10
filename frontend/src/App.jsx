import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Routes privées (sécurité plus tard) */}
        <Route path="/" element={<Home />} />
        <Route path="/group/:id" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;