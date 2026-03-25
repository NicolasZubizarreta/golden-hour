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
  
  // États UI
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgetSize, setWidgetSize] = useState('SQUARE');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openMemberDropdownId, setOpenMemberDropdownId] = useState(null);
  
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
          setError(getApiErrorMessage(err, 'Impossible de charger le dashboard du groupe.'));
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isCancelled = true; };
  }, [id]);

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
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
      setOpenMemberDropdownId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de modifier le rôle.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleKickMember = async (memberId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir exclure ce membre ?')) return;
    setError('');
    setActionLoading(`kick-${memberId}`);
    try {
      await api.delete(`/groups/${id}/members/${memberId}`);
      await fetchGroupDetails();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'exclure ce membre."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce groupe définitivement ?')) return;
    setError('');
    try {
      await api.delete(`/groups/${id}`);
      navigate('/hub');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de supprimer le groupe.'));
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!window.confirm('Transférer la propriété ? Ce membre deviendra ADMIN et vous deviendrez EDITOR.')) return;
    setError('');
    setActionLoading(`transfer-${newOwnerId}`);
    try {
      await api.put(`/groups/${id}/transfer`, { newAdminId: newOwnerId });
      await fetchGroupDetails();
      setOpenMemberDropdownId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de transférer la propriété.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUserId) return setError('Session utilisateur introuvable.');
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
      setError(getApiErrorMessage(err, "Impossible de mettre à jour le fond d'écran."));
    } finally {
      event.target.value = '';
      setActionLoading(null);
      setIsSettingsOpen(false);
    }
  };

  const handleAddWidget = async (type) => {
    setError('');
    setActionLoading(`add-widget-${widgetSize}`);
    try {
      const { data } = await api.post(`/groups/${id}/widgets`, {
        type: type, 
        size: widgetSize,
      });
      setWidgets(data.widgets || []);
      setIsWidgetModalOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'ajouter le widget."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    if (!window.confirm('Supprimer ce widget du Dashboard ?')) return;
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Chargement du Dashboard...</div>;
  if (!group) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold text-xl">{error || 'Groupe introuvable.'}</div>;

  const currentUserMemberInfo = group.members?.find((member) => member.userId === currentUserId);
  const myRole = currentUserMemberInfo?.role || 'MEMBER';
  const isCreator = currentUserId === group.createdById;
  const canManageTeam = myRole === 'ADMIN' || myRole === 'EDITOR';

  const canChangeRole = (member) => myRole === 'ADMIN' && member.userId !== group.createdById;
  const canTransferOwnership = (member) => myRole === 'ADMIN' && member.role === 'EDITOR';

  const deletingWidgetId = actionLoading?.startsWith('delete-widget-') ? parseInt(actionLoading.replace('delete-widget-', ''), 10) : null;

  return (
    <div
      className="min-h-screen font-inter flex flex-col items-center py-6 lg:py-10"
      style={{
        backgroundImage: group.coverImage ? `url(${getMediaUrl(group.coverImage)})` : 'linear-gradient(to bottom right, #fcfaf3, #faeec5)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Filtre noir supprimé */}

      <div className="w-full max-w-[1440px] px-6 md:px-[48px] z-10 flex flex-col flex-1">
        
        {/* =========================================
            TOP BAR
        ========================================= */}
        <header className="w-full relative z-50 bg-white/60 backdrop-blur-[10px] rounded-[2rem] py-[16px] px-[32px] flex flex-col md:flex-row justify-between items-center shadow-halo mb-8">
          
          <Link to="/hub" className="flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
            <img src="/LogoGoldenHour.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(0,0,0,0.25)]" />
            <h1 className="font-outfit font-black text-xl text-gray-900 drop-shadow-sm">{group.name}</h1>
          </Link>

          <div className="flex items-center gap-4 mt-4 md:mt-0 relative">
            
            {/* ZONE CODE INCRUSTÉ : shadow-creuse sur le container, shadow-halo sur le bouton */}
            <div className="flex items-center color-golden-input shadow-creuse rounded-full pl-5">
              <span className="font-mono font-bold text-sm text-gray-800 pr-5 tracking-widest">{group.inviteCode}</span>
              <button 
                onClick={handleCopyCode} 
                className="bg-white rounded-full px-6 py-2 text-xs font-extrabold text-gray-900 shadow-halo hover:bg-gray-50 transition cursor-pointer"
              >
                {copySuccess ? 'Copié !' : 'Copier'}
              </button>
            </div>

            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-halo">
              {user?.avatar ? <img src={getMediaUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold">{getInitials(user?.name)}</div>}
            </div>

            <div className="relative flex items-center">
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white rounded-[2rem] shadow-halo py-4 z-50 flex flex-col font-bold text-xs uppercase tracking-widest text-center border border-gray-100">
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  {canManageTeam && (
                    <button onClick={() => coverInputRef.current?.click()} className="py-3 text-gray-700 hover:text-black transition cursor-pointer">Changer de fond</button>
                  )}
                  {!isCreator && (
                    <button onClick={handleLeaveGroup} className="py-3 text-red-500 hover:text-red-700 transition cursor-pointer">Quitter le groupe</button>
                  )}
                  {isCreator && (
                    <>
                      <div className="w-full h-px bg-red-100 my-1"></div>
                      <button onClick={handleDeleteGroup} className="py-3 text-red-500 hover:text-red-700 transition cursor-pointer">Supprimer le groupe</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {error && <div className="w-full bg-red-100 text-red-700 p-4 rounded-2xl mb-6 text-sm font-bold text-center shadow-sm">{error}</div>}

        <div className="flex flex-col lg:flex-row gap-8 flex-1 items-stretch">
          
          {/* =========================================
              ZONE WIDGETS
          ========================================= */}
          <div className="flex-1 flex flex-col">
            <WidgetGrid
              widgets={widgets}
              canManageWidgets={canManageTeam}
              isReordering={actionLoading === 'widgets-reorder'}
              deletingWidgetId={deletingWidgetId}
              onDeleteWidget={handleDeleteWidget}
              onReorderWidgets={handleReorderWidgets}
            >
              {canManageTeam && (
                <button
                  onClick={() => setIsWidgetModalOpen(true)}
                  className="col-span-1 aspect-square bg-white/60 backdrop-blur-[10px] border-[3px] border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center p-8 hover:bg-white transition group shadow-halo cursor-pointer w-full"
                >
                  <div className="w-14 h-14 bg-gray-400 rounded-full flex items-center justify-center text-white text-3xl font-light group-hover:scale-110 transition-transform mb-4 shadow-halo">
                    +
                  </div>
                  <span className="font-bold text-gray-600 text-sm">Ajouter un Widget</span>
                </button>
              )}
            </WidgetGrid>
          </div>

          {/* =========================================
              SIDEBAR MEMBRES
          ========================================= */}
          <div className="w-full lg:w-[320px] bg-white/60 backdrop-blur-[10px] rounded-[2.5rem] p-6 shadow-halo border border-white/50 flex flex-col">
            <h2 className="font-outfit font-black text-xl text-gray-900 mb-1">Members</h2>
            <p className="text-xs font-semibold text-gray-500 mb-6">{group.members?.length || 0} Active Now</p>

            <div className="space-y-4">
              {group.members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between relative group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-halo flex items-center justify-center text-xs font-bold text-gray-600">
                      {member.user?.avatar ? <img src={getMediaUrl(member.user.avatar)} alt="Avatar" className="w-full h-full object-cover" /> : getInitials(member.user?.name)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 leading-tight">{member.user?.name || `Utilisateur`}</p>
                      
                      <button 
                        onClick={() => canManageTeam && (canChangeRole(member) || canTransferOwnership(member)) ? setOpenMemberDropdownId(openMemberDropdownId === member.id ? null : member.id) : null}
                        className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1 mt-0.5 ${canManageTeam ? 'cursor-pointer hover:text-gray-800' : 'cursor-default'}`}
                      >
                        {member.role}
                        {canManageTeam && (canChangeRole(member) || canTransferOwnership(member)) && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        )}
                      </button>

                      {openMemberDropdownId === member.id && (
                        <div className="absolute left-10 top-10 w-56 bg-white rounded-[2rem] shadow-halo py-3 z-50 flex flex-col font-bold text-[10px] uppercase tracking-widest text-center border border-gray-100">
                          {canTransferOwnership(member) && (
                            <>
                              <button onClick={() => handleTransferOwnership(member.userId)} className="py-2.5 text-gray-700 hover:text-black hover:bg-gray-50 transition cursor-pointer">Transférer la propriété</button>
                              <div className="w-full h-px bg-gray-100 my-1"></div>
                            </>
                          )}
                          {canChangeRole(member) && (
                            <>
                              <button onClick={() => handleChangeRole(member.userId, 'EDITOR')} className="py-2.5 text-gray-700 hover:text-black hover:bg-gray-50 transition cursor-pointer">Editor</button>
                              <div className="w-full h-px bg-gray-100 my-1"></div>
                              <button onClick={() => handleChangeRole(member.userId, 'MEMBER')} className="py-2.5 text-gray-700 hover:text-black hover:bg-gray-50 transition cursor-pointer">Member</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          MODALE : AJOUTER UN WIDGET
      ========================================= */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-halo relative flex flex-col items-center">
            
            {/* Bouton Fermer */}
            <button onClick={() => setIsWidgetModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 className="font-outfit font-black text-3xl text-gray-900 mb-6 w-full text-left">Ajouter un widget</h2>
            
            {/* Barre de recherche (shadow-creuse + bg-golden-input) */}
            <div className="w-full relative mb-6">
              <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Rechercher un widget..." 
                className="w-full bg-golden-input shadow-creuse rounded-full py-3.5 pl-12 pr-5 text-sm font-medium focus:outline-none text-golden-text placeholder-gray-400 transition-all" 
              />
            </div>

            {/* Grille dynamique des options (1 colonne si RECT, 2 colonnes si SQUARE) */}
            <div className={`grid gap-4 w-full mb-8 transition-all duration-300 ${widgetSize === 'SQUARE' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              
              <button 
                onClick={() => handleAddWidget('TEST')} 
                className={`bg-[#4a89f3] text-white rounded-[2rem] p-5 flex flex-col items-start hover:scale-[1.02] transition shadow-halo text-left cursor-pointer ${widgetSize === 'SQUARE' ? 'aspect-square' : 'aspect-[2.08/1]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                </div>
                <h3 className="font-bold text-lg leading-tight mt-2">Weather</h3>
                <p className="text-xs opacity-80">72° Clear Skies</p>
              </button>
              
              <button 
                onClick={() => handleAddWidget('TEST')} 
                className={`bg-[#eaf4fc] text-[#00527c] rounded-[2rem] p-5 flex flex-col items-start hover:scale-[1.02] transition shadow-halo text-left cursor-pointer ${widgetSize === 'SQUARE' ? 'aspect-square' : 'aspect-[2.08/1]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#c6e4fa] flex items-center justify-center mb-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                </div>
                <h3 className="font-bold text-lg leading-tight mt-2">Ideas</h3>
                <p className="text-xs opacity-80">12 new entries</p>
              </button>

              {/* On n'affiche que 2 cartes quand on est en mode rectangle pour ne pas faire une modale trop haute */}
              {widgetSize === 'SQUARE' && (
                <>
                  <button 
                    onClick={() => handleAddWidget('TEST')} 
                    className="bg-[#fbbf24] text-gray-900 rounded-[2rem] p-5 flex flex-col items-start hover:scale-[1.02] transition shadow-halo text-left cursor-pointer aspect-square"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center mb-auto">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mt-2">Focus</h3>
                    <p className="text-xs opacity-80">Deep work: 2h</p>
                  </button>

                  <button 
                    onClick={() => handleAddWidget('TEST')} 
                    className="bg-[#4a89f3] text-white rounded-[2rem] p-5 flex flex-col items-start hover:scale-[1.02] transition shadow-halo text-left cursor-pointer aspect-square"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-auto">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mt-2">Weather</h3>
                    <p className="text-xs opacity-80">72° Clear Skies</p>
                  </button>
                </>
              )}
            </div>

            {/* Switch Carré / Rectangle avec l'effet "Incrusté" */}
            <div className="bg-golden-input shadow-creuse rounded-full flex items-center w-full max-w-[280px]">
              <button 
                onClick={() => setWidgetSize('SQUARE')}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                  widgetSize === 'SQUARE' ? 'bg-golden-primary text-gray-900 shadow-halo' : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                Carré
              </button>
              <button 
                onClick={() => setWidgetSize('RECT')}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                  widgetSize === 'RECT' ? 'bg-golden-primary text-gray-900 shadow-halo' : 'text-gray-500 hover:text-gray-900 bg-transparent'
                }`}
              >
                Rectangle
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
