const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const createDefaultChatDraft = () => ({
  title: 'Chat du groupe',
});

export const createChatDraftFromData = (rawData) => {
  if (!isPlainObject(rawData)) {
    return createDefaultChatDraft();
  }

  return {
    title: normalizeText(rawData.title) || 'Chat du groupe',
  };
};

export const isChatWidgetSizeAllowed = (widgetSize) => widgetSize === 'RECT';

export const buildChatPayloadFromDraft = (draft, widgetSize) => {
  if (!isPlainObject(draft)) {
    return { error: 'Configuration du widget invalide.' };
  }

  if (!isChatWidgetSizeAllowed(widgetSize)) {
    return { error: 'Le widget Chat est disponible uniquement en format rectangle.' };
  }

  const title = normalizeText(draft.title) || 'Chat du groupe';

  if (title.length > 60) {
    return { error: 'Le titre du chat ne peut pas depasser 60 caracteres.' };
  }

  return {
    payload: {
      title,
    },
  };
};
