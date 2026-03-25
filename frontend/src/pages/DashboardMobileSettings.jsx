import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';
import { getMediaUrl } from '../utils/media';
import GroupMembersPanel from '../components/groups/GroupMembersPanel';

export default function DashboardMobileSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? null;
  const coverInputRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [openMemberDropdownId, setOpenMemberDropdownId] = useState(null);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 1030;
  });

  const fetchGroupDetails = async () => {
    const { data } = await api.get(`/groups/${id}`);
    const nextGroup = data.group || data;
    setGroup(nextGroup);
    setGroupNameInput(nextGroup?.name || '');
    return nextGroup;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 1029px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateViewport);
      return () => mediaQuery.removeEventListener('change', updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchGroup = async () => {
      setIsLoading(true);
      setError('');

      try {
        const groupData = await fetchGroupDetails();
        if (!isCancelled) {
          setGroup(groupData);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(getApiErrorMessage(err, 'Impossible de charger les parametres du groupe.'));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGroup();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleStartRenameGroup = () => {
    setGroupNameInput(group?.name || '');
    setIsEditingGroupName(true);
    setError('');
  };

  const handleCancelRenameGroup = () => {
    setGroupNameInput(group?.name || '');
    setIsEditingGroupName(false);
  };

  const handleRenameGroup = async (event) => {
    event.preventDefault();

    const currentName = group?.name || '';
    const trimmedName = groupNameInput.trim();

    if (!trimmedName) {
      setError('Le nom du groupe est obligatoire.');
      return;
    }

    if (trimmedName === currentName) {
      setIsEditingGroupName(false);
      return;
    }

    setError('');
    setActionLoading('rename-group');
    try {
      const { data } = await api.put(`/groups/${id}`, { name: trimmedName });
      setGroup((previousGroup) => previousGroup ? { ...previousGroup, ...data.group, name: data.group.name } : previousGroup);
      setGroupNameInput(data.group.name);
      setIsEditingGroupName(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de renommer le groupe.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    setError('');
    setActionLoading(`role-${memberId}`);
    try {
      await api.put(`/groups/${id}/members/${memberId}`, { role: newRole });
      await fetchGroupDetails();
      setOpenMemberDropdownId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de modifier le role.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!window.confirm('Transferer la propriete ? Ce membre deviendra ADMIN et vous deviendrez EDITOR.')) return;

    setError('');
    setActionLoading(`transfer-${newOwnerId}`);
    try {
      await api.put(`/groups/${id}/transfer`, { newAdminId: newOwnerId });
      await fetchGroupDetails();
      setOpenMemberDropdownId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de transferer la propriete.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setActionLoading('cover-upload');

    try {
      const formData = new FormData();
      formData.append('cover', file);
      const { data } = await api.post(`/groups/${id}/cover`, formData);
      setGroup(data.group || data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de mettre a jour le fond d'ecran."));
    } finally {
      event.target.value = '';
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUserId) {
      setError('Session utilisateur introuvable.');
      return;
    }

    if (!window.confirm('Voulez-vous vraiment quitter ce groupe ?')) return;

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

  const handleDeleteGroup = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce groupe definitivement ?')) return;

    setError('');
    setActionLoading('delete-group');
    try {
      await api.delete(`/groups/${id}`);
      navigate('/hub');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de supprimer le groupe.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isMobileViewport) {
    return <Navigate to={`/group/${id}`} replace />;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Chargement...</div>;
  }

  if (!group) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold text-xl">{error || 'Groupe introuvable.'}</div>;
  }

  const currentUserMemberInfo = group.members?.find((member) => member.userId === currentUserId);
  const myRole = currentUserMemberInfo?.role || 'MEMBER';
  const isCreator = currentUserId === group.createdById;
  const canManageTeam = myRole === 'ADMIN' || myRole === 'EDITOR';
  const canChangeRole = (member) => myRole === 'ADMIN' && member.userId !== group.createdById;
  const canTransferOwnership = (member) => myRole === 'ADMIN' && member.role === 'EDITOR';

  return (
    <div
      className="min-h-screen font-inter text-golden-text"
      style={{
        backgroundImage: group.coverImage ? `url(${getMediaUrl(group.coverImage)})` : 'linear-gradient(to bottom right, #fcfaf3, #faeec5)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full px-6 py-6">
        <div className="mx-auto w-full max-w-[1440px] space-y-8">
          <section className="rounded-golden bg-white/60 backdrop-blur-[10px] shadow-halo border border-white/50 p-5">
            <header className="flex items-start gap-4">
              <Link
                to={`/group/${id}`}
                className="shrink-0 text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer"
                aria-label="Retour au dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-1">Parametres</p>

                {isEditingGroupName ? (
                  <form onSubmit={handleRenameGroup} className="flex min-w-0 items-center gap-2">
                    <input
                      type="text"
                      value={groupNameInput}
                      onChange={(event) => setGroupNameInput(event.target.value)}
                      className="min-w-0 w-full bg-white/80 shadow-creuse rounded-golden px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-golden-primary"
                      placeholder="Nom du groupe"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={actionLoading === 'rename-group'}
                      className="shrink-0 text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Valider le nouveau nom"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRenameGroup}
                      className="shrink-0 text-gray-500 hover:text-gray-800 transition hover:scale-110 cursor-pointer"
                      aria-label="Annuler le renommage"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </form>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <h1 className="font-outfit font-black text-xl text-gray-900 truncate">{group.name}</h1>
                    {canManageTeam && (
                      <button
                        type="button"
                        onClick={handleStartRenameGroup}
                        disabled={actionLoading === 'rename-group'}
                        className="shrink-0 text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Modifier le nom du groupe"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z"></path></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </header>
          </section>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-golden text-sm font-bold text-center shadow-halo">
              {error}
            </div>
          )}

          <section className="rounded-golden bg-white/60 backdrop-blur-[10px] shadow-halo border border-white/50 p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">Code d'invitation</p>
            <div className="flex items-center w-full bg-golden-input shadow-creuse rounded-golden pl-5">
              <span className="min-w-0 flex-1 font-mono font-black text-base text-gray-900 pr-8 tracking-[0.22em] truncate">{group.inviteCode}</span>
              <button
                onClick={handleCopyCode}
                className="shrink-0 bg-white rounded-golden px-6 py-3 text-sm font-black text-gray-900 shadow-halo hover:bg-gray-50 transition cursor-pointer"
              >
                {copySuccess ? 'Copie !' : 'Copier'}
              </button>
            </div>
          </section>

          <section className="rounded-golden bg-white/60 backdrop-blur-[10px] shadow-halo border border-white/50 p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">Actions du groupe</p>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

            <div className="space-y-3">
              {canManageTeam && (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={actionLoading === 'cover-upload'}
                  className="w-full bg-golden-primary text-gray-900 rounded-golden px-5 py-3 text-sm font-extrabold shadow-halo cursor-pointer disabled:cursor-not-allowed"
                >
                  {actionLoading === 'cover-upload' ? 'Envoi...' : "Changer le fond d'ecran"}
                </button>
              )}

              {!isCreator && (
                <button
                  onClick={handleLeaveGroup}
                  disabled={actionLoading === 'leave-group'}
                  className="w-full bg-white text-red-500 rounded-golden px-5 py-3 text-sm font-extrabold shadow-halo cursor-pointer disabled:cursor-not-allowed"
                >
                  Quitter le groupe
                </button>
              )}

              {isCreator && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={actionLoading === 'delete-group'}
                  className="w-full bg-red-600 text-white rounded-golden px-5 py-3 text-sm font-extrabold shadow-halo cursor-pointer disabled:cursor-not-allowed"
                >
                  Supprimer le groupe
                </button>
              )}
            </div>
          </section>

          <GroupMembersPanel
            group={group}
            canManageTeam={canManageTeam}
            canChangeRole={canChangeRole}
            canTransferOwnership={canTransferOwnership}
            openMemberDropdownId={openMemberDropdownId}
            setOpenMemberDropdownId={setOpenMemberDropdownId}
            onChangeRole={handleChangeRole}
            onTransferOwnership={handleTransferOwnership}
            dropdownDirection="up"
            className="bg-white/60 backdrop-blur-[10px] rounded-golden p-5 shadow-halo border border-white/50 flex flex-col"
          />
        </div>
      </div>
    </div>
  );
}

