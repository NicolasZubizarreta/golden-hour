import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  // On prépare nos variables d'état pour capturer les inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Pour gérer les erreurs et l'état de chargement
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // La fonction qui s'exécute quand on clique sur "S'inscrire"
  const handleRegister = async (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    setError(''); // On réinitialise les erreurs
    setIsLoading(true);

    try {
      // On appelle l'API Back-end
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si le serveur renvoie une erreur (ex: email déjà pris)
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      // L'utilisateur est créé. 
      // Le backend renvoie un message 201, donc on redirige vers le login.
      alert('Compte créé avec succès ! Connectez-vous.');
      navigate('/login');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Créer un compte</h2>
        
        {/* Affichage du message d'erreur s'il y en a un */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom (ou Pseudo)</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Ex: John Doe"
            />
          </div>

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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="6 caractères minimum"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full font-bold py-2 rounded-lg transition mt-4 ${
              isLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isLoading ? 'Création en cours...' : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà un compte ? <Link to="/login" className="text-yellow-600 font-semibold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}