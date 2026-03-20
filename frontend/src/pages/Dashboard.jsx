import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';
import { getInitials, getMediaUrl } from '../utils/media';
import WidgetGrid from '../components/widgets/WidgetGrid';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? null;

  const [group, setGroup] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const coverInputRef = useRef(null);

  const fetchGroupDetails = async () => {
    const { data } = await api.get(`/groups/${id}`);
    const nextGroup = data.group || data;
    setGroup(nextGroup);
    return nextGroup;
  };

  const fetchWidgets = async () => {
    const { data } = await api.get(`/groups/${id}/widgets`);
    setWidgets(data.widgets || []);
    return data.widgets || [];
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [groupData, widgetData] = await Promise.all([
          fetchGroupDetails(),
          fetchWidgets(),
        ]);

        if (!isCancelled) {
          setGroup(groupData);
          setWidgets(widgetData);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleCopyCode = () => {
    if (!group?.inviteCode) {
      return;
    }

    navigator.clipboard.writeText(group.inviteCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleChangeRole = async (memberId, newRole) => {
    setError('');
    setActionLoading(`role-${memberId}`);

    try {
      await api.put(`/groups/${id}/members/${memberId}`, { role: newRole });
      await fetchGroupDetails();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de modifier le role.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleKickMember = async (memberId) => {
    if (!window.confirm('Etes-vous sur de vouloir exclure ce membre ?')) {
      return;
    }

    setError('');
    setActionLoading(`kick-${memberId}`);

    try {
      await api.delete(`/groups/${id}/members/${memberId}`);
      await fetchGroupDetails();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible d exclure ce membre.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce groupe definitivement ?')) {
      return;
    }

    setError('');

    try {
      await api.delete(`/groups/${id}`);
      navigate('/hub');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de supprimer le groupe.'));
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!window.confirm('Transferer la propriete ? Ce membre deviendra ADMIN et vous deviendrez EDITOR.')) {
      return;
    }

    setError('');
    setActionLoading(`transfer-${newOwnerId}`);

    try {
      await api.put(`/groups/${id}/transfer`, { newAdminId: newOwnerId });
      await fetchGroupDetails();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de transferer la propriete.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUserId) {
      setError('Session utilisateur introuvable.');
      return;
    }

    if (!window.confirm('Voulez-vous vraiment quitter ce groupe ?')) {
      return;
    }

    setError('');
    setActionLoading('leave-group');

    try {
      await api.delete(`/groups/${id}/members/${currentUserId}`);
      navigate('/hub');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de quitter le groupe.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');
    setActionLoading('cover-upload');

    try {
      const formData = new FormData();
      formData.append('cover', file);

      const { data } = await api.post(`/groups/${id}/cover`, formData);
      setGroup(data.group || data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de mettre a jour le fond d ecran.'));
    } finally {
      event.target.value = '';
      setActionLoading(null);
    }
  };

  const handleAddWidget = async (size) => {
    setError('');
    setActionLoading(`add-widget-${size}`);

    try {
      const { data } = await api.post(`/groups/${id}/widgets`, {
        type: 'TEST',
        size,
      });
      setWidgets(data.widgets || []);
      setIsWidgetModalOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible d ajouter le widget.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    if (!window.confirm('Supprimer ce widget du Dashboard ?')) {
      return;
    }

    setError('');
    setActionLoading(`delete-widget-${widgetId}`);

    try {
      const { data } = await api.delete(`/groups/${id}/widgets/${widgetId}`);
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de supprimer le widget.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorderWidgets = async (nextWidgets, previousWidgets) => {
    setWidgets(nextWidgets);
    setError('');
    setActionLoading('widgets-reorder');

    try {
      const { data } = await api.put(`/groups/${id}/widgets/reorder`, {
        widgets: nextWidgets.map((widget, index) => ({
          id: widget.id,
          position: index,
        })),
      });
      setWidgets(data.widgets || nextWidgets);
    } catch (err) {
      setWidgets(previousWidgets);
      setError(getApiErrorMessage(err, 'Impossible de sauvegarder le nouvel ordre.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Chargement du groupe...</div>;
  }

  if (!group) {
    return <div className="p-8 text-center text-red-500">{error || 'Groupe introuvable.'}</div>;
  }

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
  const canTransferOwnership = (member) => myRole === 'ADMIN' && member.role === 'EDITOR';

  const deletingWidgetId = actionLoading?.startsWith('delete-widget-')
    ? parseInt(actionLoading.replace('delete-widget-', ''), 10)
    : null;

  return (
    <div
      className="min-h-screen p-8 flex flex-col"
      style={group.coverImage ? {
        backgroundImage: `url(${getMediaUrl(group.coverImage)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : { backgroundColor: '#f9fafb' }}
    >
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm">
        <div>
          <Link to="/hub" className="text-sm text-blue-500 hover:underline mb-2 inline-block">Retour au Hub</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {group.type}
            </span>
          </div>
          {isCreator && (
            <p className="text-xs font-semibold text-purple-700 mt-2">Vous etes le createur initial du groupe.</p>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
              {user?.avatar ? (
                <img src={getMediaUrl(user.avatar)} alt={`Avatar de ${user.name}`} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-gray-500">{myRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Code :</span>
            <span className="text-xl font-mono font-bold bg-yellow-100 px-3 py-1 rounded text-yellow-800">
              {group.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 bg-gray-900 text-white text-sm font-bold rounded hover:bg-gray-800 transition"
            >
              {copySuccess ? 'Copie' : 'Copier'}
            </button>
          </div>
          {canManageTeam && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={actionLoading === 'cover-upload'}
                className="text-xs text-gray-700 hover:text-gray-900 underline mt-1 disabled:opacity-50"
              >
                {actionLoading === 'cover-upload' ? 'Upload...' : 'Changer le fond d ecran'}
              </button>
            </>
          )}
          {isCreator ? (
            <button onClick={handleDeleteGroup} className="text-xs text-red-500 hover:text-red-700 underline mt-1">
              Supprimer le groupe definitivement
            </button>
          ) : (
            <button
              onClick={handleLeaveGroup}
              disabled={actionLoading === 'leave-group'}
              className="text-xs text-red-500 hover:text-red-700 underline mt-1 disabled:opacity-50"
            >
              {actionLoading === 'leave-group' ? 'Depart...' : 'Quitter le groupe'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        <div className="flex-grow bg-white/92 backdrop-blur-sm rounded-[28px] shadow-sm border border-white/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Widget Engine</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Board du groupe</h2>
              <p className="text-sm text-gray-500 mt-1">
                Grille 2 colonnes, widgets carre et rectangle, ordre sauvegarde.
              </p>
            </div>

            {canManageTeam && (
              <button
                type="button"
                onClick={() => setIsWidgetModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                Ajouter un widget
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {widgets.length > 0 ? (
            <>
              <WidgetGrid
                widgets={widgets}
                canManageWidgets={canManageTeam}
                isReordering={actionLoading === 'widgets-reorder'}
                deletingWidgetId={deletingWidgetId}
                onDeleteWidget={handleDeleteWidget}
                onReorderWidgets={handleReorderWidgets}
              />

              {actionLoading === 'widgets-reorder' && (
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-gray-500">
                  Sauvegarde du nouvel ordre...
                </p>
              )}
            </>
          ) : canManageTeam ? (
            <div className="min-h-[420px] rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50/70 flex flex-col items-center justify-center text-center px-6">
              <button
                type="button"
                onClick={() => setIsWidgetModalOpen(true)}
                className="w-16 h-16 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-4xl leading-none shadow-sm hover:bg-yellow-200 transition"
              >
                +
              </button>
              <h3 className="mt-5 text-xl font-bold text-gray-900">Ajoutez vos premiers widgets</h3>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Commencez avec des widgets de test carres ou rectangles, puis reordonnez-les librement par drag and drop.
              </p>
            </div>
          ) : (
            <div className="min-h-[420px] rounded-[24px] border border-gray-200 bg-gray-50/70 flex flex-col items-center justify-center text-center px-6">
              <p className="text-lg font-semibold text-gray-700">Aucun widget pour le moment.</p>
              <p className="mt-2 text-sm text-gray-500">Un admin ou un editor doit d abord construire le board.</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 flex-shrink-0 bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Equipe ({group.members?.length || 0})</h2>

          <div className="space-y-3">
            {group.members?.map((member) => (
              <div key={member.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-white transition shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {member.user?.avatar ? (
                        <img
                          src={getMediaUrl(member.user.avatar)}
                          alt={`Avatar de ${member.user?.name || `Utilisateur ${member.userId}`}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(member.user?.name || `U${member.userId}`)
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-800 block">
                        {member.user?.name || `Utilisateur #${member.userId}`}
                      </span>
                      {member.user?.email && (
                        <span className="text-xs text-gray-500 block">{member.user.email}</span>
                      )}
                    </div>
                    {member.userId === currentUserId && (
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

                {canManageTeam && (canChangeRole(member) || canKickMember(member) || canTransferOwnership(member)) && (
                  <div className="flex flex-wrap gap-2 justify-end mt-3 pt-3 border-t border-gray-200">
                    {canTransferOwnership(member) && (
                      <button
                        onClick={() => handleTransferOwnership(member.userId)}
                        disabled={actionLoading === `transfer-${member.userId}`}
                        className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
                      >
                        {actionLoading === `transfer-${member.userId}` ? '...' : 'Rendre Admin'}
                      </button>
                    )}

                    {canChangeRole(member) && (
                      <select
                        onChange={(event) => handleChangeRole(member.userId, event.target.value)}
                        value={member.role}
                        disabled={actionLoading === `role-${member.userId}`}
                        className="text-[10px] font-medium border border-gray-300 rounded p-1 bg-white disabled:opacity-50"
                      >
                        <option value="MEMBER">Membre</option>
                        <option value="EDITOR">Editeur</option>
                      </select>
                    )}

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

      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-2xl relative">
            <button
              onClick={() => setIsWidgetModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition"
            >
              X
            </button>

            <h2 className="text-2xl font-bold mb-2">Ajouter un widget</h2>
            <p className="text-gray-500 text-sm mb-6">Le moteur de grille est pret. Commencez avec des widgets de test.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleAddWidget('SQUARE')}
                disabled={actionLoading === 'add-widget-SQUARE'}
                className="rounded-3xl bg-[#F9A826] p-5 text-left text-gray-900 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">SQUARE</span>
                <h3 className="mt-4 text-2xl font-bold">Widget Test</h3>
                <p className="mt-2 text-sm opacity-80">Une case dans la grille. Parfait pour verifier l alignement.</p>
              </button>

              <button
                type="button"
                onClick={() => handleAddWidget('RECT')}
                disabled={actionLoading === 'add-widget-RECT'}
                className="rounded-3xl bg-[#1D4ED8] p-5 text-left text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span className="text-xs font-bold uppercase tracking-[0.24em] opacity-70">RECT</span>
                <h3 className="mt-4 text-2xl font-bold">Widget Large</h3>
                <p className="mt-2 text-sm opacity-80">Deux colonnes de large pour tester les spans et le drag and drop.</p>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border-2 border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed bg-gray-50 grayscale">
                <span className="font-bold text-gray-800">Notes</span>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">Bientot</span>
              </div>
              <div className="border-2 border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed bg-gray-50 grayscale">
                <span className="font-bold text-gray-800">Spotify</span>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">Bientot</span>
              </div>
              <div className="border-2 border-gray-100 p-4 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed bg-gray-50 grayscale">
                <span className="font-bold text-gray-800">Map</span>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">Bientot</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
