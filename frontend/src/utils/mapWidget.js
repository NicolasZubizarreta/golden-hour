const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const createDefaultMapDraft = () => ({
  title: '',
  locations: [],
});

export const createMapDraftFromData = (rawData) => {
  if (!isPlainObject(rawData)) return createDefaultMapDraft();
  return {
    title: normalizeText(rawData.title),
    locations: Array.isArray(rawData.locations) ? rawData.locations : [],
  };
};

export const buildMapPayloadFromDraft = (draft) => {
  if (!isPlainObject(draft)) return { error: 'Configuration invalide.' };
  const title = normalizeText(draft.title);
  if (!title) return { error: 'Le titre de la carte est obligatoire.' };
  return {
    payload: {
      title,
      locations: Array.isArray(draft.locations) ? draft.locations : [],
    },
  };
};

export const isMapWidgetSizeAllowed = (widgetSize) => widgetSize === 'RECT';
