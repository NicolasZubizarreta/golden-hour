/* eslint-disable react-refresh/only-export-components */
import CalendarWidgetCard from './CalendarWidgetCard';
import CalendarWidgetForm from './CalendarWidgetForm';
import CountdownWidgetCard from './CountdownWidgetCard';
import CountdownWidgetForm from './CountdownWidgetForm';
import MapWidgetCard from './MapWidgetCard';
import MapWidgetForm from './MapWidgetForm';
import MusicWidgetCard from './MusicWidgetCard';
import MusicWidgetForm from './MusicWidgetForm';
import TestWidgetCard from './TestWidgetCard';
import TricountWidgetCard from './TricountWidgetCard';
import TricountWidgetForm from './TricountWidgetForm';
import ToDoWidgetCard from './ToDoWidgetCard';
import ToDoWidgetForm from './ToDoWidgetForm';
import WeatherWidgetCard, {
  WeatherWidgetForm,
  buildWeatherPayloadFromDraft,
  createDefaultWeatherDraft,
  createWeatherDraftFromData,
} from './WeatherWidget';
import {
  buildCalendarPayloadFromDraft,
  createCalendarDraftFromData,
  createDefaultCalendarDraft,
} from '../../utils/calendarWidget';
import {
  buildCountdownPayloadFromDraft,
  createCountdownDraftFromData,
  createDefaultCountdownDraft,
} from '../../utils/countdown';
import {
  buildMapPayloadFromDraft,
  createDefaultMapDraft,
  createMapDraftFromData,
  isMapWidgetSizeAllowed,
} from '../../utils/mapWidget';
import {
  buildMusicPayloadFromDraft,
  createDefaultMusicDraft,
  createMusicDraftFromData,
} from '../../utils/musicWidget';
import {
  buildTricountPayloadFromDraft,
  createDefaultTricountDraft,
  createTricountDraftFromData,
  isTricountWidgetSizeAllowed,
} from '../../utils/tricount';
import {
  buildTodoPayloadFromDraft,
  createDefaultTodoDraft,
  createTodoDraftFromData,
  isTodoWidgetSizeAllowed,
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
    isSizeAllowed: isTodoWidgetSizeAllowed,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
    {
    type: 'WEATHER',
    title: 'Météo',
    subtitle: 'Ville en direct',
    enabled: true,
    surfaceClassName: 'bg-[linear-gradient(140deg,#0CA6E0_0%,#0369A1_38%,#0EA5E9_100%)] text-[#F0F9FF]',
    iconClassName: 'bg-white/18 text-white',
    previewValue: '21 deg',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: WeatherWidgetCard,
    formComponent: WeatherWidgetForm,
    createDefaultDraft: createDefaultWeatherDraft,
    createDraftFromData: createWeatherDraftFromData,
    buildPayloadFromDraft: buildWeatherPayloadFromDraft,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 15a4 4 0 004 4h9a4 4 0 100-8 5 5 0 10-9.7 1.63 6.3 6.3 0 00-3.3 3.37" />
      </svg>
    ),
  },
  {
    type: 'CALENDAR',
    title: 'Calendrier',
    subtitle: 'Itinéraire jour par jour',
    enabled: true,
    surfaceClassName: 'bg-[linear-gradient(135deg,#1e1b4b_0%,#3730a3_55%,#1d4ed8_100%)] text-white',
    iconClassName: 'bg-white/18 text-white',
    previewValue: 'Agenda',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: CalendarWidgetCard,
    formComponent: CalendarWidgetForm,
    createDefaultDraft: createDefaultCalendarDraft,
    createDraftFromData: createCalendarDraftFromData,
    buildPayloadFromDraft: buildCalendarPayloadFromDraft,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },

  {
    type: 'MAP',
    title: 'Carte',
    subtitle: 'Lieux et activités à visiter',
    enabled: true,
    surfaceClassName: 'bg-[linear-gradient(135deg,#134E4A_0%,#0F766E_55%,#115E59_100%)] text-[#CCFBF1]',
    iconClassName: 'bg-white/18 text-white',
    previewValue: 'Carte',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: MapWidgetCard,
    formComponent: MapWidgetForm,
    createDefaultDraft: createDefaultMapDraft,
    createDraftFromData: createMapDraftFromData,
    buildPayloadFromDraft: buildMapPayloadFromDraft,
    isSizeAllowed: isMapWidgetSizeAllowed,
    hideWhenSizeInvalid: true,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    type: 'TRICOUNT',
    title: 'Tricount',
    subtitle: 'Partage des dépenses du groupe',
    enabled: true,
    requiredSize: 'RECT',
    surfaceClassName: 'bg-[linear-gradient(135deg,#92400e_0%,#d97706_55%,#78350f_100%)] text-[#FFF7ED]',
    iconClassName: 'bg-white/20 text-white',
    previewValue: '€ 0',
    modalMaxWidthClass: 'max-w-4xl',
    cardComponent: TricountWidgetCard,
    formComponent: TricountWidgetForm,
    createDefaultDraft: createDefaultTricountDraft,
    createDraftFromData: createTricountDraftFromData,
    buildPayloadFromDraft: buildTricountPayloadFromDraft,
    isSizeAllowed: isTricountWidgetSizeAllowed,
    hideWhenSizeInvalid: true,
    renderCatalogIcon: () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
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
  requiredSize: definition.requiredSize,
  isSizeAllowed: definition.isSizeAllowed,
  hideWhenSizeInvalid: definition.hideWhenSizeInvalid,
  surfaceClassName: definition.surfaceClassName,
  iconClassName: definition.iconClassName,
  previewValue: definition.previewValue,
  renderCatalogIcon: definition.renderCatalogIcon,
}));

export const getWidgetDefinition = (widgetType) => WIDGET_DEFINITION_MAP.get(widgetType) || null;

export const isWidgetSizeAllowed = (widgetType, widgetSize) => {
  const definition = getWidgetDefinition(widgetType);

  if (typeof definition?.isSizeAllowed === 'function') {
    return definition.isSizeAllowed(widgetSize);
  }

  return true;
};

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
