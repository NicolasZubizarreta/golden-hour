const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const createDefaultTodoDraft = () => ({
  title: '',
});

export const createTodoDraftFromData = (rawData) => {
  if (!isPlainObject(rawData)) {
    return createDefaultTodoDraft();
  }

  return {
    title: normalizeText(rawData.title),
  };
};

export const buildTodoPayloadFromDraft = (draft) => {
  if (!isPlainObject(draft)) {
    return { error: 'Configuration du widget invalide.' };
  }

  return {
    payload: {
      title: normalizeText(draft.title),
    },
  };
};
