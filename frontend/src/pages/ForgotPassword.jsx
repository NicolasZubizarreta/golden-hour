import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la demande.');
      }

      // L'API renvoie toujours un succès par sécurité (même si l'email n'existe pas)
      setMessage(data.message);
      setEmail(''); // On vide le champ

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Mot de passe oublié</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm text-center">{message}</div>}

        <form className="space-y-4" onSubmit={handleForgot}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="votre@email.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full font-bold py-2 rounded-lg transition mt-4 ${
              isLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-yellow-600 font-semibold hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}