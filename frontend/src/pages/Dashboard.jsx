import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api, { getApiErrorMessage } from '../api/axiosConfig';
import { getInitials, getMediaUrl } from '../utils/media';
import WidgetGrid from '../components/widgets/WidgetGrid';
import GroupMembersPanel from '../components/groups/GroupMembersPanel';
import WidgetTypePicker from '../components/widgets/WidgetTypePicker';
import {
  canEditWidgetType,
  createInitialWidgetDrafts,
  getWidgetDefinition,
  WIDGET_CATALOG,
} from '../components/widgets/widgetRegistry';

const normalizeSearchValue = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

const getWidgetSizeRestrictionMessage = (widgetDefinition) => (
  widgetDefinition?.requiredSize === 'RECT'
    ? 'Ce widget est disponible uniquement en format rectangle.'
    : 'Ce widget est disponible uniquement en format carré.'
);

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
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  
  // États UI
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgetSize, setWidgetSize] = useState('SQUARE');
  const [selectedWidgetType, setSelectedWidgetType] = useState(null);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [widgetModalError, setWidgetModalError] = useState('');
  const [widgetDrafts, setWidgetDrafts] = useState(() => createInitialWidgetDrafts());
  const [editingWidgetId, setEditingWidgetId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openMemberDropdownId, setOpenMemberDropdownId] = useState(null);
  
  const coverInputRef = useRef(null);

  const resetWidgetModalState = () => {
    setSelectedWidgetType(null);
    setWidgetSearch('');
    setWidgetModalError('');
    setWidgetSize('SQUARE');
    setWidgetDrafts(createInitialWidgetDrafts());
    setEditingWidgetId(null);
  };

  const handleOpenWidgetModal = () => {
    resetWidgetModalState();
    setIsWidgetModalOpen(true);
  };

  const handleCloseWidgetModal = () => {
    setIsWidgetModalOpen(false);
    resetWidgetModalState();
  };

  const fetchGroupDetails = async () => {
    const { data } = await api.get(`/groups/${id}`);
    const nextGroup = data.group || data;
    setGroup(nextGroup);
    setGroupNameInput(nextGroup?.name || '');
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

  const handleRegenerateCode = async () => {
    if (!window.confirm("Régénérer le code ? L'ancien code ne permettra plus de rejoindre le groupe.")) return;
    setError('');
    setActionLoading('regenerate-code');
    try {
      const { data } = await api.put(`/groups/${id}/invite-code`);
      setGroup((previousGroup) => previousGroup ? { ...previousGroup, inviteCode: data.group.inviteCode } : previousGroup);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de régénérer le code.'));
    } finally {
      setActionLoading(null);
    }
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

  const handleAddWidget = async (type, widgetData = null) => {
    const widgetDefinition = getWidgetDefinition(type);

    if (!widgetDefinition?.enabled) {
      return;
    }

    if (typeof widgetDefinition.isSizeAllowed === 'function' && !widgetDefinition.isSizeAllowed(widgetSize)) {
      const message = getWidgetSizeRestrictionMessage(widgetDefinition);
      setError(message);
      setWidgetModalError(message);
      return;
    }

    setError('');
    setWidgetModalError('');
    setActionLoading(`add-widget-${widgetSize}`);
    try {
      const payload = {
        type: type, 
        size: widgetSize,
      };

      if (widgetData) {
        payload.data = widgetData;
      }

      const { data } = await api.post(`/groups/${id}/widgets`, payload);
      setWidgets(data.widgets || []);
      handleCloseWidgetModal();
    } catch (err) {
      const message = getApiErrorMessage(err, "Impossible d'ajouter le widget.");
      setError(message);
      setWidgetModalError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectWidgetType = (type) => {
    const widgetDefinition = getWidgetDefinition(type);

    if (!widgetDefinition?.enabled) {
      return;
    }

    if (widgetDefinition.forcedSize) {
      setWidgetSize(widgetDefinition.forcedSize);
    }
    if (typeof widgetDefinition.isSizeAllowed === 'function' && !widgetDefinition.isSizeAllowed(widgetSize)) {
      setWidgetModalError(getWidgetSizeRestrictionMessage(widgetDefinition));
      return;
    }

    if (!widgetDefinition.formComponent) {
      handleAddWidget(type);
      return;
    }

    setSelectedWidgetType(type);
    setWidgetModalError('');
    setEditingWidgetId(null);
    if (widgetDefinition.requiredSize) {
      setWidgetSize(widgetDefinition.requiredSize);
    }
  };

  const handleStartEditWidget = (widget) => {
    const widgetDefinition = getWidgetDefinition(widget?.type);

    if (!widget || !canEditWidgetType(widget.type) || !widgetDefinition) {
      return;
    }

    setWidgetModalError('');
    setSelectedWidgetType(widget.type);
    setWidgetSize(widgetDefinition.forcedSize ?? (widget.size === 'RECT' ? 'RECT' : 'SQUARE'));
    const nextWidgetSize = typeof widgetDefinition.isSizeAllowed === 'function' && !widgetDefinition.isSizeAllowed(widget.size)
      ? widgetDefinition.requiredSize || 'SQUARE'
      : widget.size;
    setWidgetSize(nextWidgetSize === 'RECT' ? 'RECT' : 'SQUARE');
    setWidgetDrafts((previousDrafts) => ({
      ...previousDrafts,
      [widget.type]: widgetDefinition.createDraftFromData(widget.data),
    }));
    setEditingWidgetId(widget.id);
    setIsWidgetModalOpen(true);
  };

  const handleWidgetDraftChange = (field, value) => {
    if (!selectedWidgetType) {
      return;
    }

    setWidgetModalError('');
    setWidgetDrafts((previousDrafts) => ({
      ...previousDrafts,
      [selectedWidgetType]: {
        ...previousDrafts[selectedWidgetType],
        [field]: value,
      },
    }));
  };

  const handleSubmitWidget = async (event) => {
    event.preventDefault();

    if (!selectedWidgetType) {
      return;
    }

    const widgetDefinition = getWidgetDefinition(selectedWidgetType);

    if (!widgetDefinition || typeof widgetDefinition.buildPayloadFromDraft !== 'function') {
      setWidgetModalError("La configuration de ce widget n'est pas disponible.");
      return;
    }

    if (typeof widgetDefinition.isSizeAllowed === 'function' && !widgetDefinition.isSizeAllowed(widgetSize)) {
      setWidgetModalError(getWidgetSizeRestrictionMessage(widgetDefinition));
      return;
    }

    const selectedWidgetDraft = widgetDrafts[selectedWidgetType];
    const { payload, error: payloadError } = widgetDefinition.buildPayloadFromDraft(selectedWidgetDraft, widgetSize);

    if (payloadError) {
      setWidgetModalError(payloadError);
      return;
    }

    if (editingWidgetId) {
      setError('');
      setWidgetModalError('');
      setActionLoading(`edit-widget-${editingWidgetId}`);
      try {
        const { data } = await api.put(`/groups/${id}/widgets/${editingWidgetId}`, {
          type: selectedWidgetType,
          size: widgetSize,
          data: payload,
        });
        setWidgets(data.widgets || []);
        handleCloseWidgetModal();
      } catch (err) {
        const message = getApiErrorMessage(err, 'Impossible de mettre à jour le widget.');
        setError(message);
        setWidgetModalError(message);
      } finally {
        setActionLoading(null);
      }
      return;
    }

    await handleAddWidget(selectedWidgetType, payload);
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
  const selectedWidgetDefinition = selectedWidgetType ? getWidgetDefinition(selectedWidgetType) : null;
  const SelectedWidgetForm = selectedWidgetDefinition?.formComponent || null;
  const selectedWidgetDraft = selectedWidgetType ? widgetDrafts[selectedWidgetType] : null;
  const selectedWidgetModalMaxWidthClass = selectedWidgetDefinition?.modalMaxWidthClass || 'max-w-2xl';
  const isSavingWidget = Boolean(
    actionLoading?.startsWith('add-widget-') || actionLoading?.startsWith('edit-widget-')
  );
  const normalizedWidgetSearch = normalizeSearchValue(widgetSearch);
  const filteredWidgetOptions = WIDGET_CATALOG.filter((option) => (
    normalizedWidgetSearch === ''
      || normalizeSearchValue(`${option.title} ${option.subtitle}`).includes(normalizedWidgetSearch)
  ));

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
        <header className="w-full relative z-50 bg-white/60 backdrop-blur-[10px] rounded-golden py-[16px] px-[20px] md:px-[32px] flex items-center justify-between gap-4 shadow-halo mb-8">
          
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link to="/hub" className="shrink-0 hover:scale-[1.02] transition-transform cursor-pointer">
              <img src="/LogoGoldenHour.png" alt="Logo" className="w-10 h-10 object-contain rounded-golden drop-shadow-[0_0_5px_rgba(0,0,0,0.25)]" />
            </Link>
            <div className="min-w-0 flex-1">
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
                  <h1 className="truncate font-outfit font-black text-xl text-gray-900">{group.name}</h1>
                  {canManageTeam && (
                    <button
                      type="button"
                      onClick={handleStartRenameGroup}
                      disabled={actionLoading === 'rename-group'}
                      className="hidden min-[1030px]:block shrink-0 text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Modifier le nom du groupe"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z"></path></svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Link
            to={`/group/${id}/mobile-settings`}
            className="flex min-[1030px]:hidden shrink-0 items-center justify-center text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer"
            aria-label="Ouvrir les paramètres du groupe"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </Link>

          <div className="hidden min-[1030px]:flex items-center gap-4 relative">
            
            {/* ZONE CODE INCRUSTÉE : shadow-creuse sur le container, shadow-halo sur le bouton */}
            <div className="flex items-center bg-golden-input shadow-creuse rounded-golden pl-5">
              <span className="font-mono font-bold text-sm text-gray-800 pr-5 tracking-widest">{group.inviteCode}</span>
              <button 
                onClick={handleCopyCode} 
                className="bg-white rounded-golden px-6 py-2 text-xs font-extrabold text-gray-900 shadow-halo hover:bg-gray-50 transition cursor-pointer"
              >
                {copySuccess ? 'Copié !' : 'Copier'}
              </button>
            </div>

            <div className="w-10 h-10 rounded-golden overflow-hidden bg-gray-200 border-2 border-white shadow-halo">
              {user?.avatar ? <img src={getMediaUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold">{getInitials(user?.name)}</div>}
            </div>

            <div className="relative flex items-center">
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-gray-700 hover:text-gray-900 transition hover:scale-110 cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white rounded-golden shadow-halo py-4 z-50 flex flex-col font-bold text-xs uppercase tracking-widest text-center border border-gray-100">
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  {canManageTeam && (
                    <button onClick={() => coverInputRef.current?.click()} className="py-3 text-gray-700 hover:text-black transition cursor-pointer">Changer de fond</button>
                  )}
                  {!isCreator && (
                    <button onClick={handleLeaveGroup} className="py-3 text-red-500 hover:text-red-700 transition cursor-pointer">Quitter le groupe</button>
                  )}
                  {isCreator && (
                    <button
                      onClick={handleRegenerateCode}
                      disabled={actionLoading === 'regenerate-code'}
                      className="py-3 text-gray-700 hover:text-black transition cursor-pointer disabled:opacity-50"
                    >
                      Régénérer le code d'invitation
                    </button>
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

        {error && <div className="w-full bg-red-100 text-red-700 p-4 rounded-golden mb-6 text-sm font-bold text-center shadow-halo">{error}</div>}

        <div className="flex flex-col min-[1030px]:flex-row gap-8 flex-1 items-stretch">
          
          {/* =========================================
              ZONE WIDGETS
          ========================================= */}
          <div className="flex-1 flex flex-col">
            <WidgetGrid
              widgets={widgets}
              groupMembers={group.members || []}
              canManageWidgets={canManageTeam}
              isReordering={actionLoading === 'widgets-reorder'}
              deletingWidgetId={deletingWidgetId}
              onDeleteWidget={handleDeleteWidget}
              onEditWidget={handleStartEditWidget}
              onReorderWidgets={handleReorderWidgets}
            >
              {canManageTeam && (
                <button
                  onClick={handleOpenWidgetModal}
                  className="col-span-1 aspect-square self-start overflow-hidden bg-white/60 backdrop-blur-[10px] border-[3px] border-dashed border-gray-300 rounded-golden flex flex-col items-center justify-center [container-type:inline-size] p-[clamp(0.75rem,8cqw,2rem)] hover:bg-white transition group shadow-halo cursor-pointer w-full min-h-0"
                >
                  <div className="h-[clamp(2rem,28cqw,3.5rem)] w-[clamp(2rem,28cqw,3.5rem)] bg-gray-400 rounded-golden flex items-center justify-center text-white text-[clamp(1.25rem,16cqw,1.875rem)] font-light group-hover:scale-110 transition-transform mb-[clamp(0.45rem,5cqw,1rem)] shadow-halo shrink-0">
                    +
                  </div>
                  <span className="font-bold text-gray-600 text-[clamp(0.58rem,6cqw,0.875rem)] text-center leading-tight max-w-[8rem] sm:max-w-none">
                    Ajouter un Widget
                  </span>
                </button>
              )}
            </WidgetGrid>
          </div>

          {/* =========================================
              SIDEBAR MEMBRES
          ========================================= */}
          <GroupMembersPanel
            group={group}
            canManageTeam={canManageTeam}
            canChangeRole={canChangeRole}
            canTransferOwnership={canTransferOwnership}
            openMemberDropdownId={openMemberDropdownId}
            setOpenMemberDropdownId={setOpenMemberDropdownId}
            onChangeRole={handleChangeRole}
            onTransferOwnership={handleTransferOwnership}
            className="hidden min-[1030px]:flex w-full min-[1030px]:w-[320px] bg-white/60 backdrop-blur-[10px] rounded-golden p-6 shadow-halo border border-white/50 flex-col"
          />
        </div>
      </div>

      {/* =========================================
          MODALE : AJOUTER UN WIDGET
      ========================================= */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-golden p-8 w-full ${selectedWidgetModalMaxWidthClass} shadow-halo relative flex flex-col max-h-[min(860px,calc(100vh-32px))] overflow-hidden`}>

            <button onClick={handleCloseWidgetModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {SelectedWidgetForm ? (
              <SelectedWidgetForm
                draft={selectedWidgetDraft}
                widgetSize={widgetSize}
                modalError={widgetModalError}
                isSubmitting={isSavingWidget}
                isEditing={Boolean(editingWidgetId)}
                onBack={() => {
                  setSelectedWidgetType(null);
                  setWidgetModalError('');
                  setEditingWidgetId(null);
                }}
                onChange={handleWidgetDraftChange}
                onSubmit={handleSubmitWidget}
              />
            ) : (
              <WidgetTypePicker
                widgetSearch={widgetSearch}
                onWidgetSearchChange={setWidgetSearch}
                widgetModalError={widgetModalError}
                filteredWidgetOptions={filteredWidgetOptions}
                widgetSize={widgetSize}
                onWidgetSizeChange={setWidgetSize}
                onSelectWidgetType={handleSelectWidgetType}
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
}
