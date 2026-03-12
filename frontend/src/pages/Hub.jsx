import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Hub() {
  // On récupère l'utilisateur, le token et la fonction logout depuis notre store
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  // Nos variables d'état (State)
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('FRIENDS'); // Par défaut
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  // Fonction pour charger les groupes depuis l'API
  const fetchGroups = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/groups', {
        method: 'GET',
        // On envoie le Token au backend
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setGroups(data.groups || data || []); 
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des groupes", err);
    }
  };

  // On charge les groupes automatiquement quand la page s'affiche
  useEffect(() => {
    if (token) fetchGroups();
  }, [token]);

  // Fonction pour créer un nouveau groupe
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:3000/api/groups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newGroupName, type: newGroupType })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Erreur lors de la création');

      // Si succès : on vide le champ et on recharge la liste des groupes
      setNewGroupName('');
      fetchGroups(); 
    } catch (err) {
      setError(err.message);
    }
  };

  // Fonction pour rejoindre un groupe via un code
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:3000/api/groups/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ inviteCode: joinCode }) 
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Code invalide ou erreur.');

      setJoinCode('');
      fetchGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold">Bonjour, {user?.name || 'Aventurier'} 👋</h1>
        
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline">
            Mon Profil
          </Link>
          <button onClick={logout} className="px-4 py-2 bg-red-100 text-red-600 font-semibold rounded hover:bg-red-200">
            Déconnexion
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : Créer / Rejoindre */}
        <div className="md:col-span-1 space-y-6">
          {/* Bloc : Créer un groupe */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Créer un groupe</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input 
                type="text" 
                placeholder="Nom du groupe" 
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <select 
                value={newGroupType} 
                onChange={(e) => setNewGroupType(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="COUPLE">Couple</option>
                <option value="FRIENDS">Amis</option>
              </select>
              <button type="submit" className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded">
                Créer
              </button>
            </form>
          </div>

          {/* Bloc : Rejoindre un groupe */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Rejoindre via un code</h2>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input 
                type="text" 
                placeholder="Ex: 422871" 
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button type="submit" className="w-full bg-gray-900 text-white font-bold py-2 rounded">
                Rejoindre
              </button>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE : Liste des groupes */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Mes groupes ({groups.length})</h2>
          
          {groups.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl shadow-sm text-gray-500">
              Vous n'êtes dans aucun groupe pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Link 
                  key={group.id} 
                  to={`/group/${group.id}`} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-transparent hover:border-yellow-400 hover:shadow-md transition block"
                >
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">{group.type}</div>
                  <h3 className="text-xl font-bold text-gray-800">{group.name}</h3>
                  <div className="mt-4 text-sm text-gray-500 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                    Code: {group.inviteCode}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}