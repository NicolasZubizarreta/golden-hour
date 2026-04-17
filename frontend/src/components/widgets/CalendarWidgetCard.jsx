import { useEffect, useRef, useState } from 'react';
import WidgetCardShell from './WidgetCardShell';
import api, { getApiErrorMessage } from '../../api/axiosConfig';

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const formatDateLabel = (isoString) => {
  const d = new Date(isoString);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

const formatTime = (isoString) => {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatDateInputValue = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTimeInputValue = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const toDateKey = (isoString) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const sortEventsByStartDate = (events) => [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

const groupEventsByDate = (events) => {
  const map = {};
  events.forEach((event) => {
    const key = toDateKey(event.startDate);
    if (!map[key]) map[key] = { label: formatDateLabel(event.startDate), events: [] };
    map[key].events.push(event);
  });
  return Object.values(map);
};

const buildIso = (dateValue, timeValue = '') => {
  if (!dateValue) return null;

  const dateParts = dateValue.split('-').map((part) => parseInt(part, 10));
  const timeParts = (timeValue || '00:00').split(':').map((part) => parseInt(part, 10));
  const [year, month, day] = dateParts;
  const [hour, minute] = timeParts;

  if (
    dateParts.length !== 3
    || timeParts.length !== 2
    || !Number.isInteger(year)
    || !Number.isInteger(month) || month < 1 || month > 12
    || !Number.isInteger(day) || day < 1 || day > 31
    || !Number.isInteger(hour) || hour < 0 || hour > 23
    || !Number.isInteger(minute) || minute < 0 || minute > 59
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute);

  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
};

const formatEventRange = (event) => {
  if (!event.endDate) {
    return formatTime(event.startDate);
  }

  return `${formatDateLabel(event.startDate)} ${formatTime(event.startDate)} → ${formatDateLabel(event.endDate)} ${formatTime(event.endDate)}`;
};

const EMPTY_DT = { date: '', time: '' };

function DateTimeInput({ value, onChange, label, required = false }) {
  const set = (field, val) => onChange({ ...value, [field]: val });
  const inputClass = 'w-full min-w-0 rounded-golden bg-black/20 px-[clamp(0.45rem,5cqw,0.75rem)] py-[clamp(0.32rem,3.2cqw,0.5rem)] text-[clamp(0.48rem,5.2cqw,0.75rem)] font-bold text-white shadow-creuse focus:outline-none focus:ring-1 focus:ring-white/40 [color-scheme:dark]';

  return (
    <div className="flex flex-col gap-[clamp(0.12rem,1.6cqw,0.25rem)]">
      {label && <span className="text-[clamp(0.42rem,4.2cqw,0.625rem)] font-semibold text-white/40 uppercase tracking-wider">{label}{required && ' *'}</span>}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(4rem,5.5rem)] gap-[clamp(0.3rem,3.5cqw,0.5rem)]">
        <input
          type="date"
          value={value.date}
          onChange={(event) => set('date', event.target.value)}
          required={required}
          className={inputClass}
        />
        <input
          type="time"
          value={value.time}
          onChange={(event) => set('time', event.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

export default function CalendarWidgetCard(props) {
  const { widget, canManageWidgets = false } = props;
  const isRect = widget.size === 'RECT';
  const isPreview = typeof widget.id !== 'number';

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carré uniquement — le rectangle affiche toujours le formulaire.
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState(EMPTY_DT);
  const [newEnd, setNewEnd] = useState(EMPTY_DT);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);

  const titleInputRef = useRef(null);
  const isEditingEvent = editingEventId !== null;

  useEffect(() => {
    if (isPreview) { setIsLoading(false); return; }
    let cancelled = false;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/widgets/${widget.id}/events`);
        if (!cancelled) setEvents(data.events || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchEvents();
    return () => { cancelled = true; };
  }, [widget.id, isPreview]);

  const resetEventForm = () => {
    setNewTitle('');
    setNewStart(EMPTY_DT);
    setNewEnd(EMPTY_DT);
    setEditingEventId(null);
    setAddError('');
  };

  const handleStartEditEvent = (event) => {
    if (isPreview || !canManageWidgets) return;

    setEditingEventId(event.id);
    setNewTitle(event.title);
    setNewStart({
      date: formatDateInputValue(event.startDate),
      time: formatTimeInputValue(event.startDate),
    });
    setNewEnd(event.endDate
      ? {
          date: formatDateInputValue(event.endDate),
          time: formatTimeInputValue(event.endDate),
        }
      : EMPTY_DT);
    setAddError('');
    setShowAddForm(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || isPreview || !canManageWidgets) return;

    const startDate = buildIso(newStart.date, newStart.time);
    if (!startDate) { setAddError('Date de début invalide.'); return; }

    const hasEndDateInput = Object.values(newEnd).some(Boolean);
    const endDate = hasEndDateInput ? buildIso(newEnd.date, newEnd.time) : null;
    if (hasEndDateInput && !endDate) { setAddError('Date de fin invalide.'); return; }
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      setAddError('La date de fin doit être après la date de début.');
      return;
    }

    setIsAdding(true);
    setAddError('');
    try {
      if (isEditingEvent) {
        const { data } = await api.patch(`/events/${editingEventId}`, { title, startDate, endDate });
        setEvents((prev) => sortEventsByStartDate(prev.map((event) => (
          event.id === editingEventId ? data.event : event
        ))));
        resetEventForm();
        if (!isRect) setShowAddForm(false);
      } else {
        const { data } = await api.post(`/widgets/${widget.id}/events`, { title, startDate, endDate });
        setEvents((prev) => sortEventsByStartDate([...prev, data.event]));
        resetEventForm();
        if (!isRect) setShowAddForm(false);
        else titleInputRef.current?.focus(); // re-focus pour enchaîner les ajouts
      }
    } catch (err) {
      setAddError(getApiErrorMessage(
        err,
        isEditingEvent ? "Impossible de modifier l'événement." : "Impossible d'ajouter l'événement."
      ));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (isPreview || !canManageWidgets) return;
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    if (editingEventId === eventId) resetEventForm();
    try {
      await api.delete(`/events/${eventId}`);
    } catch {
      try {
        const { data } = await api.get(`/widgets/${widget.id}/events`);
        setEvents(data.events || []);
      } catch {}
    }
  };

  const widgetTitle = widget.data?.title || 'Calendrier';
  // Carré : 3 prochains événements max. Rectangle : tous.
  const visibleEvents = isRect ? events : events.slice(0, 3);
  const groups = groupEventsByDate(visibleEvents);

  const cardStyle = {
    background: 'linear-gradient(135deg,#1e1b4b 0%,#3730a3 55%,#1d4ed8 100%)',
    color: 'white',
  };

  const overlay = (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_28%)] pointer-events-none" />
  );

  const renderEventRow = (event) => (
    <div
      key={event.id}
      className="group flex items-start gap-[clamp(0.25rem,3cqw,0.5rem)] rounded-[10px] px-[clamp(0.35rem,4cqw,0.5rem)] py-[clamp(0.2rem,2.5cqw,0.375rem)] hover:bg-white/[0.07] transition"
    >
      <div className="mt-[clamp(0.2rem,2.4cqw,0.3125rem)] h-[clamp(0.28rem,3.2cqw,0.375rem)] w-[clamp(0.28rem,3.2cqw,0.375rem)] shrink-0 rounded-full bg-golden-primary" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-[clamp(0.58rem,6.4cqw,0.875rem)] font-semibold leading-tight text-white/90">{event.title}</p>
        <p className="mt-[clamp(0.05rem,0.8cqw,0.125rem)] truncate text-[clamp(0.46rem,4.8cqw,0.6875rem)] font-medium leading-tight text-white/45">
          {formatEventRange(event)}
        </p>
      </div>
      {canManageWidgets && (
        <div className="mt-[clamp(0.12rem,1.5cqw,0.25rem)] flex shrink-0 items-center gap-[clamp(0.12rem,1.5cqw,0.25rem)] opacity-75 transition hover:opacity-100">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => handleStartEditEvent(event)}
            className="flex h-[clamp(0.72rem,8cqw,1rem)] w-[clamp(0.72rem,8cqw,1rem)] items-center justify-center text-white/35 hover:text-white transition cursor-pointer"
            aria-label="Modifier l'événement"
          >
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z" />
            </svg>
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => handleDelete(event.id)}
            className="flex h-[clamp(0.72rem,8cqw,1rem)] w-[clamp(0.72rem,8cqw,1rem)] items-center justify-center text-white/30 hover:text-red-300 transition cursor-pointer"
            aria-label="Supprimer l'événement"
          >
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  const renderTimeline = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-center text-[clamp(0.54rem,5.5cqw,0.75rem)] font-bold text-white/30">
          Chargement...
        </div>
      );
    }
    if (groups.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-center text-[clamp(0.54rem,5.5cqw,0.75rem)] font-bold text-white/30">
          Aucun événement.
        </div>
      );
    }
    return groups.map((group) => (
      <div key={group.label}>
        <p className="px-[clamp(0.35rem,4cqw,0.5rem)] pb-[clamp(0.08rem,1cqw,0.125rem)] pt-[clamp(0.12rem,1.5cqw,0.25rem)] text-[clamp(0.42rem,4.2cqw,0.625rem)] font-black uppercase tracking-wider text-white/35">
          {group.label}
        </p>
        {group.events.map(renderEventRow)}
      </div>
    ));
  };

  const renderAddFormFields = () => (
    <>
      {isEditingEvent && (
        <div className="flex items-center justify-between gap-[clamp(0.25rem,3cqw,0.5rem)] rounded-golden bg-white/10 px-[clamp(0.55rem,5cqw,0.75rem)] py-[clamp(0.25rem,3cqw,0.375rem)] text-[clamp(0.42rem,4.2cqw,0.625rem)] font-black uppercase tracking-[0.16em] text-white/70 shadow-creuse">
          <span>Modification</span>
          <button
            type="button"
            onClick={() => {
              resetEventForm();
              if (!isRect) setShowAddForm(false);
            }}
            className="text-white/45 hover:text-white transition cursor-pointer"
          >
            Annuler
          </button>
        </div>
      )}
      {addError && <p className="text-[clamp(0.5rem,5cqw,0.75rem)] font-bold text-red-300 leading-tight">{addError}</p>}
      <div className="flex items-center gap-[clamp(0.25rem,3cqw,0.5rem)]">
        <input
          ref={titleInputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titre de l'événement..."
          className="flex-1 min-w-0 rounded-golden bg-black/20 px-[clamp(0.5rem,5cqw,0.75rem)] py-[clamp(0.25rem,3cqw,0.375rem)] text-[clamp(0.58rem,6cqw,0.875rem)] font-medium text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
        />
        <button
          type="submit"
          disabled={isAdding || !newTitle.trim() || !newStart.date}
          className="shrink-0 rounded-golden bg-white px-[clamp(0.5rem,5cqw,0.75rem)] py-[clamp(0.25rem,3cqw,0.375rem)] text-[clamp(0.58rem,6cqw,0.875rem)] font-black text-indigo-900 shadow-halo hover:bg-white/90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? '...' : (isEditingEvent ? 'OK' : '+')}
        </button>
      </div>
      <DateTimeInput
        label="Début"
        required
        value={newStart}
        onChange={setNewStart}
      />
      <DateTimeInput
        label="Fin (optionnel)"
        value={newEnd}
        onChange={setNewEnd}
      />
    </>
  );

  // ─── Format Rectangle ───────────────────────────────────────────────────────
  if (isRect) {
    return (
      <WidgetCardShell
        {...props}
        showTypeLabel={false}
        controlsTone="light"
      className="[container-type:inline-size] p-[clamp(0.55rem,3.2vw,1.45rem)]"
        style={cardStyle}
        overlay={overlay}
      >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-[clamp(0.35rem,4cqw,0.75rem)] pt-[1%]">

          {/* Title + count */}
          <div className="min-w-0 pr-[15%]">
          <h3 className="truncate whitespace-nowrap font-outfit font-black leading-[1.05] text-[clamp(0.68rem,8cqw,1.2rem)]">
              {widgetTitle}
            </h3>
            {events.length > 0 && (
              <p className="mt-[clamp(0.05rem,0.8cqw,0.125rem)] text-[clamp(0.48rem,5cqw,0.75rem)] font-medium text-white/40">
                {events.length} événement{events.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Scrollable timeline */}
          <div className="overflow-y-auto min-h-0 space-y-[clamp(0.12rem,1.6cqw,0.25rem)]">
            {renderTimeline()}
          </div>

          {canManageWidgets && (
            <form
              onSubmit={handleSubmitEvent}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex flex-col gap-[clamp(0.25rem,3cqw,0.5rem)]"
            >
              {renderAddFormFields()}
            </form>
          )}

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
      className="[container-type:inline-size] p-[clamp(0.55rem,3.2vw,1.45rem)]"
      style={cardStyle}
      overlay={overlay}
    >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-[clamp(0.35rem,4cqw,0.75rem)] pt-[1%]">

        {/* Title */}
        <div className="min-w-0 pr-[30%]">
            <h3 className="truncate whitespace-nowrap font-outfit font-black leading-[1.05] text-[clamp(0.68rem,8cqw,1.2rem)]">
            {widgetTitle}
          </h3>
        </div>

        {/* Next 3 events */}
        <div className="overflow-hidden min-h-0 space-y-[clamp(0.12rem,1.6cqw,0.25rem)]">
          {renderTimeline()}
        </div>

        {/* Footer — add button or inline form */}
        <div>
          {canManageWidgets && showAddForm ? (
            <form
              onSubmit={handleSubmitEvent}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex flex-col gap-[clamp(0.25rem,3cqw,0.5rem)]"
            >
              {renderAddFormFields()}
              <button
                type="button"
                onClick={() => {
                  resetEventForm();
                  setShowAddForm(false);
                }}
                className="text-left text-[clamp(0.5rem,5cqw,0.75rem)] font-semibold text-white/40 hover:text-white/70 transition cursor-pointer"
              >
                Annuler
              </button>
            </form>
          ) : canManageWidgets ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-[clamp(0.2rem,2.5cqw,0.375rem)] font-semibold text-white/55 hover:text-white transition cursor-pointer text-[clamp(0.52rem,5.5cqw,0.75rem)]"
            >
              <svg className="h-[clamp(0.7rem,7cqw,0.875rem)] w-[clamp(0.7rem,7cqw,0.875rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un événement
            </button>
          ) : null}
        </div>

      </div>
    </WidgetCardShell>
  );
}
