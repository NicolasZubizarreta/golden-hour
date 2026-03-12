import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate(); // Ajout du hook pour rediriger après suppression
  const { user, token } = useAuthStore();
  
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // état pour gérer l'ouverture de la modale des widgets
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  // --- REQUÊTES API EXISTANTES ---
  const fetchGroupDetails = async () => {
    try {
      setError('');
      const response = await fetch(`http://localhost:3000/api/groups/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Erreur lors du chargement');
      
      setGroup(data.group || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id, token]);

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    setError('');
    setActionLoading(`role-${memberId}`);
    try {
      const response = await fetch(`http://localhost:3000/api/groups/${id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Impossible de modifier le rôle.');
      await fetchGroupDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleKickMember = async (memberId) => {
    if (window.confirm("Êtes-vous sûr de vouloir exclure ce membre ?")) {
      setError('');
      setActionLoading(`kick-${memberId}`);
      try {
        const response = await fetch(`http://localhost:3000/api/groups/${id}/members/${memberId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Impossible d’exclure ce membre.');
        await fetchGroupDetails();
      } catch (err) {
        setError(err.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  // ---REQUÊTES API SUPPRESSION/TRANSFERT ---
  const handleDeleteGroup = async () => {
    if (window.confirm("🚨 ATTENTION : Voulez-vous vraiment supprimer ce groupe définitivement ? Toute l'équipe sera exclue.")) {
      setError('');
      try {
        const response = await fetch(`http://localhost:3000/api/groups/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Impossible de supprimer le groupe.');
        }
        navigate('/hub'); // Redirection vers le hub après suppression
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (window.confirm("Transférer la propriété ? Ce membre deviendra ADMIN et vous deviendrez EDITOR.")) {
      setError('');
      setActionLoading(`transfer-${newOwnerId}`);
      try {
        const response = await fetch(`http://localhost:3000/api/groups/${id}/transfer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newAdminId: newOwnerId }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Impossible de transférer la propriété.');
        }
        await fetchGroupDetails();
      } catch (err) {
        setError(err.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  // --- RENDU EN ATTENTE ---
  if (isLoading) return <div className="p-8 text-center">Chargement du groupe...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!group) return <div className="p-8 text-center">Groupe introuvable.</div>;

  // --- LOGIQUE DE DROITS ---
  const currentUserId = user?.id ?? null;
  const currentUserMemberInfo = group.members?.find((member) => member.userId === currentUserId);
  const myRole = currentUserMemberInfo?.role || 'MEMBER';
  const isCreator = currentUserId === group.createdById;
  const canManageTeam = myRole === 'ADMIN' || myRole === 'EDITOR';
  
  const canChangeRole = (member) => myRole === 'ADMIN' && member.userId !== group.createdById;
  const canKickMember = (member) => {
    if (member.userId === group.createdById) return false;
    if (myRole === 'ADMIN') return member.userId !== currentUserId;
    if (myRole === 'EDITOR') return member.role === 'MEMBER' && member.userId !== currentUserId;
    return false;
  };
  // Seul un ADMIN peut transférer à un EDITOR
  const canTransferOwnership = (member) => myRole === 'ADMIN' && member.role === 'EDITOR';

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col">
      {/* HEADER AMÉLIORÉ */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm">
        <div>
          <Link to="/hub" className="text-sm text-blue-500 hover:underline mb-2 inline-block">← Retour au Hub</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {group.type}
            </span>
          </div>
          {isCreator && (
            <p className="text-xs font-semibold text-purple-700 mt-2">Vous êtes le créateur initial du groupe.</p>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Code :</span>
            <span className="text-xl font-mono font-bold bg-yellow-100 px-3 py-1 rounded text-yellow-800">
              {group.inviteCode}
            </span>
            <button 
              onClick={handleCopyCode}
              className="px-3 py-1 bg-gray-900 text-white text-sm font-bold rounded hover:bg-gray-800 transition"
            >
              {copySuccess ? 'Copié ! ✅' : 'Copier'}
            </button>
          </div>
          {/* Bouton de suppression réservé à l'Admin */}
          {myRole === 'ADMIN' && (
            <button onClick={handleDeleteGroup} className="text-xs text-red-500 hover:text-red-700 underline mt-1">
              Supprimer le groupe définitivement
            </button>
          )}
        </div>
      </div>

      {/* ZONE CENTRALE : WIDGETS ET MEMBRES */}
      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        
        {/* COLONNE GAUCHE : LES WIDGETS (Coquille vide) */}
        <div className="flex-grow bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[400px] p-8">
          {canManageTeam ? (
            <div className="text-center">
              <button 
                onClick={() => setIsWidgetModalOpen(true)}
                className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-yellow-200 hover:scale-105 transition shadow-sm"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
              <h3 className="font-bold text-gray-800 text-lg">Ajouter un Widget</h3>
              <p className="text-sm text-gray-500 mt-1">Personnalisez votre espace avec des notes, cartes, etc.</p>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <p className="font-medium">Espace de travail vide.</p>
              <p className="text-sm">Seuls les Admins et Éditeurs peuvent ajouter des widgets.</p>
            </div>
          )}
        </div>

        {/* COLONNE DROITE : LES MEMBRES (Sidebar) */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Équipe ({group.members?.length || 0})</h2>
          
          <div className="space-y-3">
            {group.members?.map((member) => (
              <div key={member.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-white transition shadow-sm">
                
                {/* Info Utilisateur */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-sm text-gray-800 block">
                      {member.user?.name || `Utilisateur #${member.userId}`}
                    </span>
                    {member.userId === user.id && (
                      <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Moi</span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                    member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    member.role === 'EDITOR' ? 'bg-green-100 text-green-700' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {member.role}
                  </span>
                </div>

                {/* Actions */}
                {canManageTeam && (canChangeRole(member) || canKickMember(member) || canTransferOwnership(member)) && (
                  <div className="flex flex-wrap gap-2 justify-end mt-3 pt-3 border-t border-gray-200">
                    
                    {/* Bouton Rendre Admin */}
                    {canTransferOwnership(member) && (
                      <button 
                        onClick={() => handleTransferOwnership(member.userId)}
                        disabled={actionLoading === `transfer-${member.userId}`}
                        className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
                      >
                        {actionLoading === `transfer-${member.userId}` ? '...' : 'Rendre Admin'}
                      </button>
                    )}

                    {/* Select Rôle */}
                    {canChangeRole(member) && (
                      <select 
                        onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                        value={member.role}
                        disabled={actionLoading === `role-${member.userId}`}
                        className="text-[10px] font-medium border border-gray-300 rounded p-1 bg-white disabled:opacity-50"
                      >
                        <option value="MEMBER">Membre</option>
                        <option value="EDITOR">Éditeur</option>
                      </select>
                    )}

                    {/* Bouton Exclure */}
                    {canKickMember(member) && (
                      <button 
                        onClick={() => handleKickMember(member.userId)}
                        disabled={actionLoading === `kick-${member.userId}`}
                        className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {actionLoading === `kick-${member.userId}` ? '...' : 'Exclure'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALE D'AJOUT DE WIDGETS (Fausse) */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg relative animate-fade-in-up">
            <button 
              onClick={() => setIsWidgetModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-2">Catalogue de Widgets</h2>
            <p className="text-gray-500 text-sm mb-6">Ajoutez des modules pour organiser votre groupe.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed bg-gray-50 grayscale">
                <span className="font-bold text-gray-800">📝 Notes</span>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">Bientôt</span>
              </div>
              <div className="border-2 border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed bg-gray-50 grayscale">
                <span className="font-bold text-gray-800">🎵 Spotify</span>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">Bientôt</span>
              </div>
              <div className="border-2 border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed bg-gray-50 grayscale">
                <span className="font-bold text-gray-800">🗺️ Carte</span>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">Bientôt</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}