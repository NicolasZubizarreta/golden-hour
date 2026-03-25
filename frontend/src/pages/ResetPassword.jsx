import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../api/axiosConfig';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!token) {
      setError("Aucun jeton de sécurité trouvé dans l'URL.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setMessage('Mot de passe modifié avec succès ! Vous allez être redirigé...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la réinitialisation.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-golden-bg from-80% to-[#faeec5] font-inter text-golden-text flex flex-col">
      <header className="absolute top-0 left-0 w-full z-20">
        <div className="container-golden py-[32px] flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
            <img
              src="/LogoGoldenHour.png"
              alt="Logo Golden Hour"
              className="w-10 h-10 object-contain rounded-golden drop-shadow-[0_0_5px_rgba(0,0,0,0.25)]"
            />
            <span className="font-outfit font-extrabold text-xl tracking-wide uppercase">Golden Hour</span>
          </Link>

          <Link to="/login" className="px-6 py-2 bg-gray-100 text-golden-text rounded-golden font-semibold hover:bg-gray-200 transition text-sm shadow-halo">
            Connexion
          </Link>
        </div>
      </header>

      <main className="container-golden flex-1 flex flex-col justify-center items-center pt-[128px] pb-[48px]">
        <div className="w-full max-w-[480px] bg-golden-card p-10 md:p-12 rounded-golden shadow-halo z-10">
          <h2 className="text-3xl font-outfit font-black mb-2">Réinitialisation</h2>
          <p className="text-golden-muted mb-8 text-sm">Créez votre nouveau mot de passe</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-golden mb-6 text-sm text-center font-medium shadow-halo">{error}</div>}
          {message && <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-golden mb-6 text-sm text-center font-medium shadow-halo">{message}</div>}

          {!message && (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Nouveau mot de passe</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-golden-input shadow-creuse rounded-golden px-5 py-3.5 pr-12 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-lg tracking-widest"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Confirmer le mot de passe</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-golden-input shadow-creuse rounded-golden px-5 py-3.5 pr-12 text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-lg tracking-widest"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 font-inter font-bold text-lg py-4 rounded-golden transition-transform mt-2 shadow-halo tracking-wide ${
                  isLoading ? 'bg-yellow-300 text-yellow-700 cursor-not-allowed' : 'bg-golden-primary text-golden-text hover:scale-[1.02] cursor-pointer'
                }`}
              >
                {isLoading ? 'Modification...' : 'Changer de mot de passe'}
                {!isLoading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

