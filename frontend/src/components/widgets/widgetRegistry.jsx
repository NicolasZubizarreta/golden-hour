import CountdownWidgetCard from './CountdownWidgetCard';
import CountdownWidgetForm from './CountdownWidgetForm';
import MusicWidgetCard from './MusicWidgetCard';
import MusicWidgetForm from './MusicWidgetForm';
import TestWidgetCard from './TestWidgetCard';
import ToDoWidgetCard from './ToDoWidgetCard';
import ToDoWidgetForm from './ToDoWidgetForm';
import {
  buildCountdownPayloadFromDraft,
  createCountdownDraftFromData,
  createDefaultCountdownDraft,
} from '../../utils/countdown';
import {
  buildMusicPayloadFromDraft,
  createDefaultMusicDraft,
  createMusicDraftFromData,
} from '../../utils/musicWidget';
import {
  buildTodoPayloadFromDraft,
  createDefaultTodoDraft,
  createTodoDraftFromData,
} from '../../utils/todoWidget';

const WIDGET_DEFINITIONS = [
  {
    type: 'COUNTDOWN',
    title: 'Compte à rebours',
    subtitle: 'Événement unique ou récurrent',
    enabled: true,
    surfaceClassName: 'bg-[linear-gradient(135deg,#B45309_0%,#EA580C_55%,#7C2D12_100%)] text-[#FFF7ED]',
    iconClassName: 'bg-white/20 text-white',
    previewValue: 'J-14',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: CountdownWidgetCard,
    formComponent: CountdownWidgetForm,
    createDefaultDraft: createDefaultCountdownDraft,
    createDraftFromData: createCountdownDraftFromData,
    buildPayloadFromDraft: buildCountdownPayloadFromDraft,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    ),
  },
  {
    type: 'NOTES',
    title: 'Notes',
    subtitle: 'Bientôt disponible',
    enabled: false,
    surfaceClassName: 'bg-[#F5F3F0] text-golden-muted',
    iconClassName: 'bg-white text-golden-muted',
    previewValue: 'Bientôt',
    modalMaxWidthClass: 'max-w-2xl',
    cardComponent: TestWidgetCard,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414A1 1 0 0118 8.414V19a2 2 0 01-2 2z"></path>
      </svg>
    ),
  },
  {
    type: 'MUSIC',
    title: 'Musique',
    subtitle: 'YouTube Music ou Deezer',
    enabled: true,
    surfaceClassName: 'bg-[linear-gradient(135deg,#0f172a_0%,#166534_38%,#7c3aed_100%)] text-white',
    iconClassName: 'bg-white/18 text-white',
    previewValue: 'Play',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: MusicWidgetCard,
    formComponent: MusicWidgetForm,
    createDefaultDraft: createDefaultMusicDraft,
    createDraftFromData: createMusicDraftFromData,
    buildPayloadFromDraft: buildMusicPayloadFromDraft,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 18V6l10-2v12M9 18a2 2 0 11-4 0 2 2 0 014 0zm10-2a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
    ),
  },
  {
    type: 'TODO',
    title: 'Liste de tâches',
    subtitle: 'Tâches assignables aux membres',
    enabled: true,
    surfaceClassName: 'bg-[linear-gradient(135deg,#052E16_0%,#16A34A_55%,#15803D_100%)] text-[#F0FDF4]',
    iconClassName: 'bg-white/18 text-white',
    previewValue: 'Tâches',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: ToDoWidgetCard,
    formComponent: ToDoWidgetForm,
    createDefaultDraft: createDefaultTodoDraft,
    createDraftFromData: createTodoDraftFromData,
    buildPayloadFromDraft: buildTodoPayloadFromDraft,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    type: 'MAP',
    title: 'Map',
    subtitle: 'Bientôt disponible',
    enabled: false,
    surfaceClassName: 'bg-[#EBF5FF] text-[#1D4ED8]',
    iconClassName: 'bg-white text-[#1D4ED8]',
    previewValue: 'Bientôt',
    modalMaxWidthClass: 'max-w-2xl',
    cardComponent: TestWidgetCard,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2m0 18l6-3m-6 3V2m6 15l6 3m-6-3V5m6 15V8m0 12l-6-3"></path>
      </svg>
    ),
  },
];

const WIDGET_DEFINITION_MAP = new Map(
  WIDGET_DEFINITIONS.map((definition) => [definition.type, definition])
);

export const WIDGET_CATALOG = WIDGET_DEFINITIONS.map((definition) => ({
  type: definition.type,
  title: definition.title,
  subtitle: definition.subtitle,
  enabled: definition.enabled,
  surfaceClassName: definition.surfaceClassName,
  iconClassName: definition.iconClassName,
  previewValue: definition.previewValue,
  renderCatalogIcon: definition.renderCatalogIcon,
}));

export const getWidgetDefinition = (widgetType) => WIDGET_DEFINITION_MAP.get(widgetType) || null;

export const getWidgetCardComponent = (widgetType) => (
  getWidgetDefinition(widgetType)?.cardComponent || TestWidgetCard
);

export const canEditWidgetType = (widgetType) => {
  const definition = getWidgetDefinition(widgetType);

  return Boolean(
    definition?.formComponent
    && typeof definition.createDefaultDraft === 'function'
    && typeof definition.createDraftFromData === 'function'
    && typeof definition.buildPayloadFromDraft === 'function'
  );
};

export const createInitialWidgetDrafts = () => WIDGET_DEFINITIONS.reduce((drafts, definition) => {
  if (typeof definition.createDefaultDraft === 'function') {
    drafts[definition.type] = definition.createDefaultDraft();
  }

  return drafts;
}, {});
