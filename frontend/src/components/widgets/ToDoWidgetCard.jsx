import { useEffect, useRef, useState } from 'react';
import WidgetCardShell from './WidgetCardShell';
import api, { getApiErrorMessage } from '../../api/axiosConfig';
import { getInitials, getMediaUrl } from '../../utils/media';

export default function ToDoWidgetCard(props) {
  const { widget, groupMembers = [] } = props;

  const isRect = widget.size === 'RECT';

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // Carré : formulaire masqué par défaut. Rectangle : toujours visible.
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const rectInputRef = useRef(null);
  const isPreview = typeof widget.id !== 'number';

  useEffect(() => {
    if (isPreview) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/widgets/${widget.id}/tasks`);
        if (!cancelled) setTasks(data.tasks || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchTasks();
    return () => { cancelled = true; };
  }, [widget.id, isPreview]);

  const notifyTasksUpdated = () => {
    window.dispatchEvent(new CustomEvent('golden:tasks-updated', { detail: { widgetId: widget.id } }));
  };

  const handleToggle = async (task) => {
    if (togglingId === task.id || isPreview) return;

    const next = !task.isCompleted;
    setTogglingId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: next } : t)));

    try {
      const { data } = await api.patch(`/tasks/${task.id}`, { isCompleted: next });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...(data.task || {}) } : t)));
      notifyTasksUpdated();
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: task.isCompleted } : t)));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (taskId) => {
    if (isPreview) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
      notifyTasksUpdated();
    } catch {
      try {
        const { data } = await api.get(`/widgets/${widget.id}/tasks`);
        setTasks(data.tasks || []);
      } catch {}
    }
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title || isPreview) return;

    setIsAdding(true);
    setAddError('');
    try {
      const payload = { title };
      if (newAssigneeId) payload.assignedToId = Number(newAssigneeId);
      const { data } = await api.post(`/widgets/${widget.id}/tasks`, payload);
      setTasks((prev) => [...prev, data.task]);
      setNewTitle('');
      setNewAssigneeId('');
      if (!isRect) setShowAddForm(false);
      if (isRect) rectInputRef.current?.focus();
      notifyTasksUpdated();
    } catch (err) {
      setAddError(getApiErrorMessage(err, "Impossible d'ajouter la tâche."));
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewTitle('');
    setNewAssigneeId('');
    setAddError('');
  };

  const title = widget.data?.title || 'Liste de tâches';
  const completed = tasks.filter((t) => t.isCompleted).length;
  const progressPct = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

  // Carré : 4 tâches non complétées max. Rectangle : toutes les tâches.
  const visibleTasks = isRect
    ? tasks
    : tasks.filter((t) => !t.isCompleted).slice(0, 4);

  const renderTaskRow = (task) => {
    const assignee = task.assignee || task.assignedTo || null;
    return (
      <div
        key={task.id}
        className="group flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 hover:bg-white/[0.07] transition"
      >
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleToggle(task)}
          className={`shrink-0 rounded-[4px] border-2 flex items-center justify-center transition cursor-pointer w-5 h-5
            ${task.isCompleted
              ? 'bg-golden-primary border-golden-primary'
              : 'bg-white/10 border-white/40 hover:border-golden-primary'
            }`}
          aria-label={task.isCompleted ? 'Marquer comme non faite' : 'Marquer comme faite'}
        >
          {task.isCompleted && (
            <svg className="w-[60%] h-[60%] text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <span className={`flex-1 min-w-0 leading-tight truncate font-semibold text-sm transition ${
          task.isCompleted ? 'line-through text-white/35' : 'text-white/90'
        }`}>
          {task.title}
        </span>

        {assignee && (
          <div
            title={assignee.name}
            className="shrink-0 rounded-full overflow-hidden bg-white/15 flex items-center justify-center font-bold text-white w-7 h-7 text-[0.52rem]"
          >
            {assignee.avatar ? (
              <img src={getMediaUrl(assignee.avatar)} alt={assignee.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(assignee.name)
            )}
          </div>
        )}

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleDelete(task.id)}
          className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white/30 hover:text-red-300 transition cursor-pointer w-4 h-4"
          aria-label="Supprimer la tâche"
        >
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  // ─── Champs du formulaire d'ajout (partagés carré / rectangle) ─────────────
  const renderAddFormFields = (inputRef) => (
    <>
      {addError && (
        <p className="text-xs font-bold text-red-300 leading-tight">{addError}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nouvelle tâche..."
          className="flex-1 min-w-0 rounded-golden bg-black/20 px-3 py-1.5 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
        />
        <button
          type="submit"
          disabled={isAdding || !newTitle.trim()}
          className="shrink-0 rounded-golden bg-white px-3 py-1.5 text-sm font-black text-green-800 shadow-halo hover:bg-white/90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? '...' : '+'}
        </button>
      </div>
      {groupMembers.length > 0 && (
        <select
          value={newAssigneeId}
          onChange={(e) => setNewAssigneeId(e.target.value)}
          className="w-full rounded-golden bg-black/20 px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer"
        >
          <option value="" className="text-gray-900">Assigner à... (optionnel)</option>
          {groupMembers.map((member) => (
            <option key={member.userId} value={member.userId} className="text-gray-900">
              {member.user?.name || 'Membre'}
            </option>
          ))}
        </select>
      )}
    </>
  );

  // ─── Format Rectangle ───────────────────────────────────────────────────────
  if (isRect) {
    return (
      <WidgetCardShell
        {...props}
        showTypeLabel={false}
        controlsTone="light"
        className="p-[clamp(0.9rem,4.5vw,1.45rem)]"
        style={{ background: '#16A34A', color: '#F0FDF4' }}
        overlay={<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)] pointer-events-none" />}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 pt-[1%]">

          {/* Title + progress */}
          <div className="min-w-0 pr-[15%]">
            <h3 className="truncate whitespace-nowrap font-outfit font-black leading-[1.05] text-[clamp(0.9rem,3.5vw,1.2rem)]">
              {title}
            </h3>
            {tasks.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-[2.5px] rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-golden-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="shrink-0 font-bold text-white/50 whitespace-nowrap text-xs">
                  {completed}/{tasks.length}
                </span>
              </div>
            )}
          </div>

          {/* Scrollable task list */}
          <div className="overflow-y-auto min-h-0 space-y-0.5">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
                Chargement...
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
                Aucune tâche pour le moment.
              </div>
            ) : (
              visibleTasks.map(renderTaskRow)
            )}
          </div>

          {/* Always-visible input at bottom */}
          <form
            onSubmit={handleAddTask}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex flex-col gap-2"
          >
            {renderAddFormFields(rectInputRef)}
          </form>

        </div>
      </WidgetCardShell>
    );
  }

  // ─── Format Carré ───────────────────────────────────────────────────────────
  return (
    <WidgetCardShell
      {...props}
      showTypeLabel={false}
      controlsTone="light"
      className="p-[clamp(0.9rem,4.5vw,1.45rem)]"
      style={{ background: '#16A34A', color: '#F0FDF4' }}
      overlay={<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)] pointer-events-none" />}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 pt-[1%]">

        {/* Title + progress */}
        <div className="min-w-0 pr-[30%]">
          <h3 className="truncate whitespace-nowrap font-outfit font-black leading-[1.05] text-[clamp(0.9rem,3.5vw,1.2rem)]">
            {title}
          </h3>
          {tasks.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-[2.5px] rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-golden-primary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="shrink-0 font-bold text-white/50 whitespace-nowrap text-xs">
                {completed}/{tasks.length}
              </span>
            </div>
          )}
        </div>

        {/* First 4 uncompleted tasks only */}
        <div className="overflow-hidden min-h-0 space-y-0.5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
              Chargement...
            </div>
          ) : visibleTasks.length === 0 && !showAddForm ? (
            <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
              Aucune tâche pour le moment.
            </div>
          ) : (
            visibleTasks.map(renderTaskRow)
          )}
        </div>

        {/* Footer — compact add button or inline form */}
        <div>
          {showAddForm ? (
            <form
              onSubmit={handleAddTask}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex flex-col gap-2"
            >
              {renderAddFormFields(null)}
              <button
                type="button"
                onClick={handleCancelAdd}
                className="text-left text-xs font-semibold text-white/40 hover:text-white/70 transition cursor-pointer"
              >
                Annuler
              </button>
            </form>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 font-semibold text-white/55 hover:text-white transition cursor-pointer text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une tâche
            </button>
          )}
        </div>

      </div>
    </WidgetCardShell>
  );
}
