import { useEffect, useMemo, useState } from 'react';
import WidgetCardShell from './WidgetCardShell';
import api from '../../api/axiosConfig';
import { COUNTDOWN_APPEARANCE_TYPES, getCountdownProgressData } from '../../utils/countdown';

const getAllCountdowns = (allWidgets, selfId) =>
  allWidgets.filter((w) => w.type === 'COUNTDOWN' && w.id !== selfId);

const getFirstTodo = (allWidgets) => allWidgets.find((w) => w.type === 'TODO') ?? null;

const getContrastTextColor = (hexColor) => {
  if (typeof hexColor !== 'string' || !/^#([0-9a-fA-F]{6})$/.test(hexColor)) return '#FEFCE8';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#1F2937' : '#FEFCE8';
};

function SectionLabel({ icon, label, color }) {
  return (
    <div
      className="flex items-center gap-1.5 text-[clamp(0.48rem,0.95cqw,0.62rem)] font-bold uppercase tracking-[0.18em] mb-[clamp(0.3rem,1.2cqw,0.6rem)]"
      style={{ color }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

const IconClock = ({ color }) => (
  <svg className="w-3 h-3 shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCheck = ({ color }) => (
  <svg className="w-3 h-3 shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const IconPeople = ({ color }) => (
  <svg className="w-3 h-3 shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function SummaryWidgetCard(props) {
  const { widget, groupMembers = [], allWidgets = [] } = props;
  const [now, setNow] = useState(() => new Date());
  const [uncompletedTasks, setUncompletedTasks] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const countdownWidgets = useMemo(
    () => getAllCountdowns(allWidgets, widget.id),
    [allWidgets, widget.id],
  );

  const countdownEntries = useMemo(
    () => countdownWidgets
      .map((w) => ({ widget: w, data: getCountdownProgressData(w.data, now) }))
      .filter((entry) => entry.data !== null)
      .sort((a, b) => {
        if (a.data.snapshot.isComplete && !b.data.snapshot.isComplete) return 1;
        if (!a.data.snapshot.isComplete && b.data.snapshot.isComplete) return -1;
        const aMs = a.data.units.days * 86400 + a.data.units.hours * 3600 + a.data.units.minutes * 60;
        const bMs = b.data.units.days * 86400 + b.data.units.hours * 3600 + b.data.units.minutes * 60;
        return aMs - bMs;
      }),
    [countdownWidgets, now],
  );

  const todoWidget = useMemo(() => getFirstTodo(allWidgets), [allWidgets]);
  const todoWidgetId = todoWidget?.id ?? null;
  const isPreview = typeof widget.id !== 'number';

  useEffect(() => {
    if (!todoWidgetId || isPreview) { setUncompletedTasks([]); return undefined; }
    let cancelled = false;
    api.get(`/widgets/${todoWidgetId}/tasks`).then(({ data }) => {
      if (!cancelled) setUncompletedTasks((data.tasks || []).filter((t) => !t.isCompleted));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [todoWidgetId, isPreview]);

  useEffect(() => {
    if (!todoWidgetId || isPreview) return undefined;
    const handler = (event) => {
      if (event.detail?.widgetId !== todoWidgetId) return;
      api.get(`/widgets/${todoWidgetId}/tasks`).then(({ data }) => {
        setUncompletedTasks((data.tasks || []).filter((t) => !t.isCompleted));
      }).catch(() => {});
    };
    window.addEventListener('golden:tasks-updated', handler);
    return () => window.removeEventListener('golden:tasks-updated', handler);
  }, [todoWidgetId, isPreview]);

  // Apparence
  const appearance = widget.data?.appearance;
  const isImageBg = appearance?.backgroundType === COUNTDOWN_APPEARANCE_TYPES.IMAGE
    && typeof appearance?.backgroundImage === 'string'
    && appearance.backgroundImage.trim() !== '';

  const textColor = isImageBg
    ? '#FEFCE8'
    : getContrastTextColor(appearance?.backgroundColor ?? '#3B1F07');
  const controlsTone = textColor === '#1F2937' ? 'dark' : 'light';

  const cardStyle = isImageBg
    ? { backgroundImage: `url(${appearance.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: textColor }
    : { background: appearance?.backgroundColor ?? '#3B1F07', color: textColor };

  const overlayClass = isImageBg
    ? 'absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.42))] pointer-events-none'
    : 'absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)] pointer-events-none';

  const labelColor = textColor === '#1F2937' ? 'rgba(31,41,55,0.5)' : 'rgba(254,252,232,0.5)';
  const dividerColor = textColor === '#1F2937' ? 'rgba(31,41,55,0.1)' : 'rgba(254,252,232,0.1)';
  const subColor = textColor === '#1F2937' ? 'rgba(31,41,55,0.45)' : 'rgba(254,252,232,0.45)';

  const formatDays = (entry) => {
    if (entry.data.snapshot.isComplete) return 'Terminé';
    if (entry.data.units.days === 0) return 'Auj.';
    return `J-${entry.data.units.days}`;
  };

  return (
    <WidgetCardShell
      {...props}
      showTypeLabel={false}
      controlsTone={controlsTone}
      className="@container p-[clamp(0.7rem,3.5cqw,1.2rem)]"
      style={cardStyle}
      overlay={<div className={overlayClass} />}
    >
      <div className="flex h-full min-h-0 flex-col gap-[clamp(0.4rem,1.8cqw,0.8rem)]">

        {/* Titre */}
        <div className="flex items-center justify-between pr-[28%]">
          <h3
            className="truncate font-outfit text-[clamp(0.8rem,2.2cqw,1.3rem)] font-black leading-none"
            style={{ color: textColor }}
          >
            Résumé
          </h3>
        </div>

        {/* Contenu : 3 colonnes */}
        <div
          className="grid flex-1 min-h-0 grid-cols-3 gap-[clamp(0.4rem,2cqw,1rem)]"
          style={{ borderTop: `1px solid ${dividerColor}`, paddingTop: 'clamp(0.4rem,1.5cqw,0.7rem)' }}
        >

          {/* Colonne 1 : Comptes à rebours */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <SectionLabel icon={<IconClock color={labelColor} />} label="Événements" color={labelColor} />
            {countdownEntries.length === 0 ? (
              <p className="text-[clamp(0.48rem,1cqw,0.64rem)] font-semibold" style={{ color: subColor }}>
                Aucun compte à rebours
              </p>
            ) : (
              <div className="flex flex-col gap-[clamp(0.25rem,1cqw,0.5rem)] overflow-hidden">
                {countdownEntries.map((entry) => (
                  <div
                    key={entry.widget.id}
                    className="flex items-baseline justify-between gap-1 min-w-0"
                    style={{ borderBottom: `1px solid ${dividerColor}`, paddingBottom: 'clamp(0.2rem,0.8cqw,0.4rem)' }}
                  >
                    <span
                      className="truncate text-[clamp(0.5rem,1.05cqw,0.68rem)] font-semibold leading-tight"
                      style={{ color: textColor }}
                    >
                      {entry.data.snapshot.title}
                    </span>
                    <span
                      className="shrink-0 font-outfit font-black text-[clamp(0.55rem,1.15cqw,0.75rem)] leading-none"
                      style={{ color: textColor }}
                    >
                      {formatDays(entry)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonne 2 : Tâches à faire */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <SectionLabel icon={<IconCheck color={labelColor} />} label="À faire" color={labelColor} />
            {uncompletedTasks.length === 0 ? (
              <p className="text-[clamp(0.48rem,1cqw,0.64rem)] font-semibold" style={{ color: subColor }}>
                {todoWidget ? 'Toutes les tâches sont faites ✓' : 'Aucune liste de tâches'}
              </p>
            ) : (
              <div className="flex flex-col gap-[clamp(0.2rem,0.8cqw,0.4rem)] overflow-hidden">
                {uncompletedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-1.5 min-w-0"
                  >
                    <span
                      className="shrink-0 w-1 h-1 rounded-full"
                      style={{ background: labelColor }}
                    />
                    <span
                      className="truncate text-[clamp(0.5rem,1.05cqw,0.68rem)] font-semibold leading-tight"
                      style={{ color: textColor }}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonne 3 : Membres */}
          <div className="flex flex-col min-h-0">
            <SectionLabel icon={<IconPeople color={labelColor} />} label="Membres" color={labelColor} />
            <p
              className="font-outfit font-black leading-none text-[clamp(1rem,2.8cqw,1.6rem)]"
              style={{ color: textColor }}
            >
              {groupMembers.length > 0 ? groupMembers.length : '—'}
            </p>
            <p
              className="mt-1 text-[clamp(0.48rem,1cqw,0.64rem)] font-semibold"
              style={{ color: subColor }}
            >
              dans le groupe
            </p>
          </div>

        </div>
      </div>
    </WidgetCardShell>
  );
}
