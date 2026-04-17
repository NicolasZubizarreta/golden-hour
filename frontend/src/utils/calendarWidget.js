const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const createDefaultCalendarDraft = () => ({
  title: '',
});

export const createCalendarDraftFromData = (rawData) => {
  if (!isPlainObject(rawData)) {
    return createDefaultCalendarDraft();
  }

  return {
    title: normalizeText(rawData.title),
  };
};

export const buildCalendarPayloadFromDraft = (draft) => {
  if (!isPlainObject(draft)) {
    return { error: 'Configuration du widget invalide.' };
  }

  const title = normalizeText(draft.title);

  if (!title) {
    return { error: 'Le nom du calendrier est obligatoire.' };
  }

  return {
    payload: {
      title,
    },
  };
};
