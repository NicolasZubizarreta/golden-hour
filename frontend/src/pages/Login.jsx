import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      loginAction(data.user, data.token);
      navigate('/hub');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la connexion'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* LE FOND : Toujours en min-h-screen avec le dégradé à 80% */
    <div className="relative min-h-screen bg-gradient-to-b from-golden-bg from-80% to-[#faeec5] font-inter text-golden-text flex flex-col">
      
      {/* 1. LE HEADER (ABSOLUTE) : Avec tes 32px de padding interne (py-[32px]) */}
      <header className="absolute top-0 left-0 w-full z-20">
        <div className="container-golden py-[32px] flex justify-between items-center">
          
          {/* Logo redirigeant vers la Home */}
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
            <img 
              src="/LogoGoldenHour.png" 
              alt="Logo Golden Hour" 
              /* Remplacement de shadow-halo par le drop-shadow de Tailwind */
              className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(0,0,0,0.25)] rounded-full" 
            />
            <span className="font-outfit font-extrabold text-xl tracking-wide uppercase">Golden Hour</span>
          </Link>
          
          <Link to="/register" className="px-6 py-2 bg-gray-100 text-golden-text rounded-full font-semibold hover:bg-gray-200 transition text-sm shadow-halo">
            Inscription
          </Link>
        </div>
      </header>

      {/* 2. LE CONTENU (FORMULAIRE) : Centré pile au milieu de l'écran */}
      <main className="container-golden flex-1 flex flex-col justify-center items-center">
        
        {/* CARTE CENTRALE */}
        <div className="w-full max-w-[480px] bg-golden-card p-10 md:p-12 rounded-golden shadow-halo z-10">
          <h2 className="text-3xl font-outfit font-black mb-2">Bienvenue</h2>
          <p className="text-golden-muted mb-8 text-sm">Connectez-vous pour continuer</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl mb-6 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Email</label>
              <div className="relative flex items-center">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-golden-input shadow-creuse rounded-full px-5 py-3.5 pr-12 text-golden-text placeholder-golden-muted focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm"
                  placeholder="votre@email.com"
                />
                {/* Icône Mail à droite */}
                <svg className="absolute right-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
            </div>
            
            {/* MOT DE PASSE */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs text-golden-muted hover:text-golden-text font-medium">Oublié ?</Link>
              </div>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-golden-input shadow-creuse rounded-full px-5 py-3.5 pr-12 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-lg tracking-widest"
                  placeholder="••••••••"
                />
                {/* Icône Œil à droite */}
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
              </div>
            </div>

            {/* BOUTON SUBMIT */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 font-inter font-bold text-lg py-4 rounded-full transition-transform mt-2 shadow-halo ${
                isLoading ? 'bg-yellow-300 text-yellow-700 cursor-not-allowed' : 'bg-golden-primary text-golden-text hover:scale-[1.02]'
              }`}
            >
              {isLoading ? 'Connexion...' : 'Se Connecter'}
              {!isLoading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER TEXT */}
      <p className="absolute bottom-10 left-0 w-full text-center text-sm text-golden-muted">
        Pas encore de compte ? <Link to="/register" className="text-golden-text font-extrabold hover:underline">Créer un profil</Link>
      </p>

    </div>
  );
}