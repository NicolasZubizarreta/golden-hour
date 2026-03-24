import { useState } from 'react';
/* FUSION DES IMPORTS : On ne met qu'une seule ligne pour react-router-dom */
import { Link, useNavigate } from 'react-router-dom'; 
import api, { getApiErrorMessage } from '../api/axiosConfig';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || "Si cet email existe, un lien vous a été envoyé.");
      setEmail(''); 
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la demande.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-golden-bg from-80% to-[#faeec5] font-inter text-golden-text flex flex-col">
      
      {/* 1. LE HEADER (ABSOLUTE) : Identique au Login */}
      <header className="absolute top-0 left-0 w-full z-20">
        <div className="container-golden py-[32px] flex justify-between items-center">
          
          {/* Logo redirigeant vers la Home */}
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
            <img 
              src="/LogoGoldenHour.png" 
              alt="Logo Golden Hour" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(0,0,0,0.25)] rounded-full" 
            />
            <span className="font-outfit font-extrabold text-xl tracking-wide uppercase">Golden Hour</span>
          </Link>
          
          {/* Bouton de retour vers Login */}
          <Link to="/login" className="px-6 py-2 bg-gray-100 text-golden-text rounded-full font-semibold hover:bg-gray-200 transition text-sm shadow-halo">
            Connexion
          </Link>
        </div>
      </header>

      {/* 2. LE CONTENU (FORMULAIRE) */}
      <main className="container-golden flex-1 flex flex-col justify-center items-center">
        <div className="w-full max-w-[480px] bg-golden-card p-10 md:p-12 rounded-golden shadow-halo z-10">
          <h2 className="text-3xl font-outfit font-black mb-3">Mot de passe oublié</h2>
          <p className="text-golden-muted mb-8 text-sm leading-relaxed">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl mb-6 text-sm text-center font-medium">{error}</div>}
          {message && <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-2xl mb-6 text-sm text-center font-medium">{message}</div>}

          <form className="space-y-6" onSubmit={handleForgot}>
            <div>
              <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Email</label>
              <div className="relative flex items-center">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-golden-input shadow-creuse rounded-full px-5 py-3.5 pr-12 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm"
                  placeholder="votre@email.com"
                />
                <svg className="absolute right-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 font-inter font-bold text-lg py-4 rounded-full transition-transform mt-2 shadow-halo tracking-wide ${
                isLoading ? 'bg-yellow-300 text-yellow-700 cursor-not-allowed' : 'bg-golden-primary text-golden-text hover:scale-[1.02]'
              }`}
            >
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
              {!isLoading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}