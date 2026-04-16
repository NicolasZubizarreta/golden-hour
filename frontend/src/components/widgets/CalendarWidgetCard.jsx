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

const toDateKey = (isoString) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const groupEventsByDate = (events) => {
  const map = {};
  events.forEach((event) => {
    const key = toDateKey(event.startDate);
    if (!map[key]) map[key] = { label: formatDateLabel(event.startDate), events: [] };
    map[key].events.push(event);
  });
  return Object.values(map);
};

const buildIso = (d, m, y, h, min) => {
  if (!d || !m || !y) return null;
  const date = new Date(
    parseInt(y, 10),
    parseInt(m, 10) - 1,
    parseInt(d, 10),
    parseInt(h || '0', 10),
    parseInt(min || '0', 10),
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const EMPTY_DT = { d: '', m: '', y: '', h: '', min: '' };

function DateTimeInput({ value, onChange, label, required = false, inputClass = '' }) {
  const mRef = useRef(null);
  const yRef = useRef(null);
  const hRef = useRef(null);
  const minRef = useRef(null);

  const set = (field, val) => onChange({ ...value, [field]: val });

  const handleDay = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    set('d', v);
    if (v.length === 2) mRef.current?.focus();
  };
  const handleMonth = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    set('m', v);
    if (v.length === 2) yRef.current?.focus();
  };
  const handleYear = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    set('y', v);
    if (v.length === 4) hRef.current?.focus();
  };
  const handleHour = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    set('h', v);
    if (v.length === 2) minRef.current?.focus();
  };
  const handleMin = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    set('min', v);
  };

  const base = `bg-black/20 text-white font-medium focus:outline-none focus:ring-1 focus:ring-white/40 rounded-[6px] text-center ${inputClass}`;
  const sm = `${base} w-7 px-0.5 py-1 text-xs`;
  const lg = `${base} w-9 px-0.5 py-1 text-xs`;
  const sep = 'text-white/30 text-xs font-bold select-none';

  return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{label}{required && ' *'}</span>}
      <div className="flex items-center gap-1">
        <input inputMode="numeric" placeholder="JJ" value={value.d} onChange={handleDay} className={sm} />
        <span className={sep}>/</span>
        <input ref={mRef} inputMode="numeric" placeholder="MM" value={value.m} onChange={handleMonth} className={sm} />
        <span className={sep}>/</span>
        <input ref={yRef} inputMode="numeric" placeholder="AAAA" value={value.y} onChange={handleYear} className={lg} />
        <span className={`${sep} ml-1`}>à</span>
        <input ref={hRef} inputMode="numeric" placeholder="HH" value={value.h} onChange={handleHour} className={sm} />
        <span className={sep}>:</span>
        <input ref={minRef} inputMode="numeric" placeholder="MM" value={value.min} onChange={handleMin} className={sm} />
      </div>
    </div>
  );
}

export default function CalendarWidgetCard(props) {
  const { widget } = props;
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

  const titleInputRef = useRef(null);

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

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || isPreview) return;

    const startDate = buildIso(newStart.d, newStart.m, newStart.y, newStart.h, newStart.min);
    if (!startDate) { setAddError('Date de début invalide (JJ/MM/AAAA HH:MM).'); return; }

    const endDate = buildIso(newEnd.d, newEnd.m, newEnd.y, newEnd.h, newEnd.min);

    setIsAdding(true);
    setAddError('');
    try {
      const { data } = await api.post(`/widgets/${widget.id}/events`, { title, startDate, endDate });
      setEvents((prev) => [...prev, data.event].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)));
      setNewTitle('');
      setNewStart(EMPTY_DT);
      setNewEnd(EMPTY_DT);
      if (!isRect) setShowAddForm(false);
      else titleInputRef.current?.focus(); // re-focus pour enchaîner les ajouts
    } catch (err) {
      setAddError(getApiErrorMessage(err, "Impossible d'ajouter l'événement."));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (isPreview) return;
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
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
      className="group flex items-start gap-2 rounded-[10px] px-2 py-1.5 hover:bg-white/[0.07] transition"
    >
      <div className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full bg-golden-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90 truncate leading-tight">{event.title}</p>
        <p className="text-[11px] font-medium text-white/45 leading-tight mt-0.5">
          {formatTime(event.startDate)}
          {event.endDate ? ` → ${formatTime(event.endDate)}` : ''}
        </p>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => handleDelete(event.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white/30 hover:text-red-300 transition cursor-pointer w-4 h-4 mt-1"
        aria-label="Supprimer l'événement"
      >
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const renderTimeline = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
          Chargement...
        </div>
      );
    }
    if (groups.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-xs font-bold text-white/30">
          Aucun événement.
        </div>
      );
    }
    return groups.map((group) => (
      <div key={group.label}>
        <p className="px-2 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-white/35">
          {group.label}
        </p>
        {group.events.map(renderEventRow)}
      </div>
    ));
  };

  const renderAddFormFields = () => (
    <>
      {addError && <p className="text-xs font-bold text-red-300 leading-tight">{addError}</p>}
      <div className="flex items-center gap-2">
        <input
          ref={titleInputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titre de l'événement..."
          className="flex-1 min-w-0 rounded-golden bg-black/20 px-3 py-1.5 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
        />
        <button
          type="submit"
          disabled={isAdding || !newTitle.trim() || !newStart.d || !newStart.m || !newStart.y}
          className="shrink-0 rounded-golden bg-white px-3 py-1.5 text-sm font-black text-indigo-900 shadow-halo hover:bg-white/90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? '...' : '+'}
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
        className="p-[clamp(0.9rem,4.5vw,1.45rem)]"
        style={cardStyle}
        overlay={overlay}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 pt-[1%]">

          {/* Title + count */}
          <div className="min-w-0 pr-[15%]">
            <h3 className="truncate whitespace-nowrap font-outfit font-black leading-[1.05] text-[clamp(0.9rem,3.5vw,1.2rem)]">
              {widgetTitle}
            </h3>
            {events.length > 0 && (
              <p className="mt-0.5 text-xs font-medium text-white/40">
                {events.length} événement{events.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Scrollable timeline */}
          <div className="overflow-y-auto min-h-0 space-y-1">
            {renderTimeline()}
          </div>

          {/* Always-visible add form */}
          <form
            onSubmit={handleAddEvent}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex flex-col gap-2"
          >
            {renderAddFormFields()}
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
      style={cardStyle}
      overlay={overlay}
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 pt-[1%]">

        {/* Title */}
        <div className="min-w-0 pr-[30%]">
          <h3 className="truncate whitespace-nowrap font-outfit font-black leading-[1.05] text-[clamp(0.9rem,3.5vw,1.2rem)]">
            {widgetTitle}
          </h3>
        </div>

        {/* Next 3 events */}
        <div className="overflow-hidden min-h-0 space-y-1">
          {renderTimeline()}
        </div>

        {/* Footer — add button or inline form */}
        <div>
          {showAddForm ? (
            <form
              onSubmit={handleAddEvent}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex flex-col gap-2"
            >
              {renderAddFormFields()}
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddError(''); }}
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
              Ajouter un événement
            </button>
          )}
        </div>

      </div>
    </WidgetCardShell>
  );
}
