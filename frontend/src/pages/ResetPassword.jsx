import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Outil pour lire l'URL (?token=...)
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); 

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!token) {
      setError("Aucun jeton de sécurité trouvé dans l'URL.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation.');
      }

      setMessage("Mot de passe modifié avec succès ! Vous allez être redirigé...");
      
      // Redirection automatique vers la connexion après 2.5 secondes
      setTimeout(() => navigate('/login'), 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Nouveau mot de passe</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm text-center">{message}</div>}

        {!message && (
          <form className="space-y-4" onSubmit={handleReset}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="6 caractères minimum"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full font-bold py-2 rounded-lg transition mt-4 ${
                isLoading ? 'bg-yellow-300 text-gray-600 cursor-not-allowed' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
              }`}
            >
              {isLoading ? 'Modification...' : 'Valider'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-gray-500 hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}