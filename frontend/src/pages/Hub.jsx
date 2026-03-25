import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';
import { getInitials, getMediaUrl } from '../utils/media';

export default function Hub() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('FRIENDS');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  // États pour les Pop-ups
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.groups || data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des groupes", err);
    }
  };

  useEffect(() => {
    if (token) fetchGroups();
  }, [token]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/groups', { name: newGroupName, type: newGroupType });
      setNewGroupName('');
      setIsCreating(false);
      fetchGroups(); 
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la création'));
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/groups/join', { inviteCode: joinCode });
      setJoinCode('');
      setIsJoining(false);
      fetchGroups();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Code invalide ou erreur.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-golden-bg font-inter text-golden-text">
      
      {/* =========================================
          HEADER
      ========================================= */}
      <header className="relative z-20 bg-golden-bg shadow-halo">
        <div className="container-golden py-[32px] flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Avatar & Bonjour */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 shadow-halo flex items-center justify-center text-lg font-bold text-gray-500">
              {user?.avatar ? (
                <img src={getMediaUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name || 'A')
              )}
            </div>
            <h1 className="font-outfit font-black text-2xl uppercase tracking-wider text-gray-900">
              Bonjour, {user?.name || 'Aventurier'} 👋
            </h1>
          </div>

          {/* Barre de recherche (Ombre creuse) */}
          <div className="relative w-full max-w-md hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Rechercher un groupe..." 
              className="w-full bg-golden-input shadow-creuse rounded-full py-3.5 pl-14 pr-5 text-sm font-medium text-golden-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all"
            />
          </div>
          
          {/* Actions (Déconnexion & Profil) */}
          <div className="flex items-center gap-4">
            <button onClick={logout} className="px-6 py-3 bg-red-100 text-red-500 font-bold rounded-full shadow-halo hover:bg-red-200 transition text-sm">
              Déconnexion
            </button>
            <Link to="/profile" className="w-12 h-12 bg-[#fef2cd] text-golden-primary shadow-halo rounded-full flex items-center justify-center hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================
          MAIN 
      ========================================= */}
      <main className="flex-1 container-golden py-[48px]">
        
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-8 text-sm text-center font-bold max-w-2xl mx-auto w-full shadow-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* CARTE : BOUTON CRÉER */}
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#fef2cd] border-[3px] border-dashed border-[#f4d783] rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center aspect-[4/3] hover:bg-[#fcebb6] transition-colors group shadow-halo"
          >
            {/* AJOUT DU SHADOW-HALO ICI */}
            <div className="w-16 h-16 bg-golden-primary rounded-full flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform shadow-halo">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </div>
            <h3 className="font-outfit font-black text-2xl text-gray-900 mb-2">Créer un groupe</h3>
            <p className="text-sm text-gray-600 font-medium">Lancez votre propre communauté</p>
          </button>

          {/* CARTE : BOUTON REJOINDRE */}
          <button 
            onClick={() => setIsJoining(true)}
            className="bg-white/60 border-[3px] border-dashed border-gray-300 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center aspect-[4/3] hover:bg-white transition-colors group shadow-halo"
          >
            {/* AJOUT DU SHADOW-HALO ICI */}
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-500 group-hover:scale-110 transition-transform shadow-halo">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            </div>
            <h3 className="font-outfit font-black text-2xl text-gray-900 mb-2">Rejoindre</h3>
            <p className="text-sm text-gray-500 font-medium">Avec un code d'invitation</p>
          </button>

          {/* CARTES : GROUPES EXISTANTS */}
          {groups.map((group) => (
            <Link 
              key={group.id} 
              to={`/group/${group.id}`} 
              className="relative rounded-[2.5rem] overflow-hidden aspect-[4/3] group shadow-halo transition-all duration-300 transform hover:-translate-y-1"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${getMediaUrl(group.coverImage) || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>

              {/* Pilule d'info */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur-md rounded-[2rem] p-4 px-6 flex justify-between items-center shadow-halo">
                <div className="flex flex-col">
                  <h3 className="font-outfit font-black text-gray-900 uppercase text-lg leading-tight truncate max-w-[150px] sm:max-w-[180px]">
                    {group.name}
                  </h3>
                  <div className="text-gray-500 text-xs font-semibold flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>
                    {group.members?.length || 1} membres
                  </div>
                </div>

                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  group.type === 'COUPLE' 
                    ? 'border-purple-300 text-purple-700 bg-purple-100' 
                    : 'border-green-300 text-green-700 bg-green-100'
                }`}>
                  {group.type === 'FRIENDS' ? 'AMIS' : group.type}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* =========================================
          FOOTER
      ========================================= */}
      <footer className="relative z-20 bg-golden-bg shadow-halo mt-auto">
        <div className="container-golden py-[32px] flex justify-between items-center text-sm font-bold text-gray-800">
          <div className="flex items-center gap-3">
            {/* CORRECTION DU LOGO ICI (drop-shadow) */}
            <img src="/LogoGoldenHour.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_5px_rgba(0,0,0,0.25)]" />
            <span className="font-outfit uppercase tracking-widest text-xs">Golden Hour © 2026</span>
          </div>
          <Link to="/privacy" className="hover:underline">Confidentialité</Link>
        </div>
      </footer>

      {/* =========================================
          MODALES (POP-UPS CENTRÉES)
      ========================================= */}

      {/* Modale : Créer un groupe */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-golden-card rounded-[2.5rem] p-10 max-w-[480px] w-full shadow-halo relative">
            <button onClick={() => setIsCreating(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
            
            <h2 className="font-outfit font-black text-4xl text-gray-900 mb-1 tracking-tight">Créer un groupe</h2>
            <p className="text-golden-muted text-sm mb-8">Organiser vos sorties avec Golden Hour</p>
            
            <form onSubmit={handleCreateGroup} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Nom du groupe</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <input type="text" placeholder="Dream Team" required value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full bg-golden-input shadow-creuse rounded-full py-3.5 pl-12 pr-5 text-golden-text focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Type de groupe</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <select value={newGroupType} onChange={(e) => setNewGroupType(e.target.value)} className="w-full bg-golden-input shadow-creuse rounded-full py-3.5 pl-12 pr-10 text-golden-text focus:outline-none focus:ring-2 focus:ring-golden-primary transition-all text-sm appearance-none cursor-pointer">
                    <option value="FRIENDS">AMIS</option>
                    <option value="COUPLE">COUPLE</option>
                  </select>
                  <svg className="absolute right-5 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <button type="submit" className="w-full bg-golden-primary text-golden-text font-bold text-lg py-4 rounded-full shadow-halo hover:scale-[1.02] transition-transform mt-4 flex items-center justify-center gap-2">
                Créer le groupe <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modale : Rejoindre un groupe */}
      {isJoining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-golden-card rounded-[2.5rem] p-10 max-w-[480px] w-full shadow-halo relative">
            <button onClick={() => setIsJoining(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
            
            <h2 className="font-outfit font-black text-4xl text-gray-900 mb-1 tracking-tight">Rejoindre</h2>
            <p className="text-golden-muted text-sm mb-8">Saisissez le code d'invitation de vos amis</p>
            
            <form onSubmit={handleJoinGroup} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-golden-text uppercase tracking-wider mb-2">Code du groupe</label>
                <div className="relative flex items-center">
                  <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  <input type="text" placeholder="Ex: 422871" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-full bg-golden-input shadow-creuse rounded-full py-3.5 pl-12 pr-5 text-golden-text tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all text-lg" />
                </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-full shadow-halo hover:scale-[1.02] transition-transform mt-4 flex items-center justify-center gap-2">
                Rejoindre le groupe <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}