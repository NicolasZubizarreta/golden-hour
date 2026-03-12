import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Dashboard() {
  const { id } = useParams(); // Récupère le "1" de /group/1
  const { user, token } = useAuthStore();
  
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Récupérer les infos du groupe (et ses membres)
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

  // Fonction pour copier le code d'invitation
  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Remet le bouton à zéro après 2s
    }
  };

  // Actions d'administration
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

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de modifier le rôle.');
      }

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Impossible d’exclure ce membre.');
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

  // --- LOGIQUE DE DROITS (RBAC Front-end) ---
  // On cherche le rôle de l'utilisateur actuel dans la liste des membres du groupe
  const currentUserId = user?.id ?? null;
  const currentUserMemberInfo = group.members?.find((member) => member.userId === currentUserId);
  const myRole = currentUserMemberInfo?.role || 'MEMBER';
  const isCreator = currentUserId === group.createdById;
  const canManageTeam = myRole === 'ADMIN' || myRole === 'EDITOR';
  const canChangeRole = (member) => myRole === 'ADMIN' && member.userId !== group.createdById;
  const canKickMember = (member) => {
    if (member.userId === group.createdById) {
      return false;
    }

    if (myRole === 'ADMIN') {
      return member.userId !== currentUserId;
    }

    if (myRole === 'EDITOR') {
      return member.role === 'MEMBER' && member.userId !== currentUserId;
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/hub" className="text-sm text-blue-500 hover:underline mb-2 inline-block">← Retour au Hub</Link>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Type: {group.type}</p>
          {isCreator && (
            <p className="text-xs font-semibold text-purple-700 mt-2">Vous êtes le propriétaire du groupe.</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Code d'invitation :</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-bold bg-yellow-100 px-3 py-1 rounded text-yellow-800">
              #{group.inviteCode}
            </span>
            <button 
              onClick={handleCopyCode}
              className="px-3 py-2 bg-gray-900 text-white text-sm font-bold rounded hover:bg-gray-800 transition"
            >
              {copySuccess ? 'Copié ! ✅' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION MEMBRES */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">Membres de l'équipe ({group.members?.length || 0})</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 font-semibold text-gray-600">Utilisateur</th>
                <th className="py-3 font-semibold text-gray-600">Rôle</th>
                {canManageTeam && <th className="py-3 font-semibold text-gray-600 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {group.members?.map((member) => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3">
                    <span className="font-medium">{member.user?.name || `Utilisateur #${member.userId}`}</span>
                    {member.userId === user.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Moi</span>}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'EDITOR' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  
                  {/* Actions visibles uniquement si le backend autorise réellement l'action */}
                  {canManageTeam && (
                    <td className="py-3 text-right">
                      {canChangeRole(member) || canKickMember(member) ? (
                        <div className="flex justify-end gap-2">
                          {canChangeRole(member) && (
                            <select 
                              onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                              value={member.role}
                              disabled={actionLoading === `role-${member.userId}`}
                              className="text-sm border rounded p-1 disabled:opacity-60"
                            >
                              <option value="MEMBER">Membre</option>
                              <option value="EDITOR">Éditeur</option>
                            </select>
                          )}

                          {canKickMember(member) && (
                            <button 
                              onClick={() => handleKickMember(member.userId)}
                              disabled={actionLoading === `kick-${member.userId}`}
                              className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-60"
                            >
                              {actionLoading === `kick-${member.userId}` ? 'Exclusion...' : 'Exclure'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Intouchable</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
