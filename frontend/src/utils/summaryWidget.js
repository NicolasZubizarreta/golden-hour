import {
  COUNTDOWN_APPEARANCE_TYPES,
  normalizeAppearanceFromDraft,
  normalizeAppearanceFromWidgetData,
} from './countdown';

const DEFAULT_BG_COLOR = '#3B1F07';

export const createDefaultSummaryDraft = () => ({
  backgroundType: COUNTDOWN_APPEARANCE_TYPES.COLOR,
  backgroundColor: DEFAULT_BG_COLOR,
  backgroundImage: '',
});

export const createSummaryDraftFromData = (rawData) => {
  const appearance = normalizeAppearanceFromWidgetData(rawData?.appearance);
  return {
    backgroundType: appearance.backgroundType,
    backgroundColor: appearance.backgroundColor ?? DEFAULT_BG_COLOR,
    backgroundImage: appearance.backgroundImage ?? '',
  };
};

export const buildSummaryPayloadFromDraft = (draft) => {
  const result = normalizeAppearanceFromDraft(draft);
  if (result.error) return { error: result.error };
  return { payload: { appearance: result.appearance } };
};
