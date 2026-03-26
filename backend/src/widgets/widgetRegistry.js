const WIDGET_TYPES = ['TEST', 'NOTES', 'MAP', 'SPOTIFY', 'BUDGET', 'COUNTDOWN'];
const WIDGET_SIZES = ['SQUARE', 'RECT'];
const COUNTDOWN_TYPES = ['SINGLE', 'RECURRING'];
const COUNTDOWN_FREQUENCIES = ['WEEKLY', 'MONTHLY_FIRST'];
const COUNTDOWN_APPEARANCE_TYPES = ['COLOR', 'IMAGE'];

const TEST_WIDGET_PRESETS = {
  SQUARE: [
    { title: 'Focus', subtitle: 'Widget test', background: '#F9A826', text: '#1F2937' },
    { title: 'Ideas', subtitle: 'Widget test', background: '#8FD3F4', text: '#0F172A' },
    { title: 'Night', subtitle: 'Widget test', background: '#1F3A5F', text: '#F8FAFC' },
    { title: 'Pulse', subtitle: 'Widget test', background: '#FF6B6B', text: '#FFF7ED' },
  ],
  RECT: [
    { title: 'Wide Flow', subtitle: 'Widget rectangle', background: '#0F766E', text: '#ECFEFF' },
    { title: 'Weekend', subtitle: 'Widget rectangle', background: '#7C3AED', text: '#F5F3FF' },
    { title: 'Sunset', subtitle: 'Widget rectangle', background: '#EA580C', text: '#FFF7ED' },
    { title: 'Signal', subtitle: 'Widget rectangle', background: '#1D4ED8', text: '#EFF6FF' },
  ],
};

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const normalizeTrimmedString = (value) => typeof value === 'string' ? value.trim() : '';

const normalizeEnumValue = (value, allowedValues) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();
  return allowedValues.includes(normalizedValue) ? normalizedValue : null;
};

const normalizeCountdownTime = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
};

const normalizeCountdownDay = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsedDay = parseInt(value, 10);
    return parsedDay >= 0 && parsedDay <= 6 ? parsedDay : null;
  }

  return null;
};

const normalizeIsoDateString = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
};

const normalizeHexColor = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return /^#([0-9a-fA-F]{6})$/.test(trimmedValue) ? trimmedValue : null;
};

const normalizeCountdownAppearance = (value) => {
  if (value === undefined) {
    return {
      backgroundType: 'COLOR',
      backgroundColor: '#EA580C',
    };
  }

  if (!isPlainObject(value)) {
    return { error: "L'apparence du compte a rebours est invalide." };
  }

  const backgroundType = normalizeEnumValue(value.backgroundType, COUNTDOWN_APPEARANCE_TYPES) || 'COLOR';

  if (backgroundType === 'IMAGE') {
    const backgroundImage = normalizeTrimmedString(value.backgroundImage);

    if (!backgroundImage) {
      return { error: "L'image de fond du compte a rebours est obligatoire." };
    }

    return {
      backgroundType: 'IMAGE',
      backgroundImage,
    };
  }

  return {
    backgroundType: 'COLOR',
    backgroundColor: normalizeHexColor(value.backgroundColor) || '#EA580C',
  };
};

const normalizeCountdownData = (value) => {
  if (!isPlainObject(value)) {
    return { error: 'La configuration du compte a rebours est invalide.' };
  }

  const title = normalizeTrimmedString(value.title);
  if (!title) {
    return { error: 'Le titre du compte a rebours est obligatoire.' };
  }

  const countdownType = normalizeEnumValue(value.type, COUNTDOWN_TYPES);
  if (!countdownType) {
    return { error: 'Le type du compte a rebours doit etre SINGLE ou RECURRING.' };
  }

  if (countdownType === 'SINGLE') {
    const appearance = normalizeCountdownAppearance(value.appearance);
    const targetDate = normalizeIsoDateString(value.targetDate);
    const startedAt = value.startedAt === undefined
      ? new Date().toISOString()
      : normalizeIsoDateString(value.startedAt);

    if (appearance.error) {
      return { error: appearance.error };
    }

    if (!targetDate || !startedAt) {
      return { error: "La date cible du compte a rebours est invalide." };
    }

    return {
      data: {
        title,
        type: 'SINGLE',
        targetDate,
        startedAt,
        appearance,
      },
    };
  }

  if (!isPlainObject(value.recurrence)) {
    return { error: 'La recurrence du compte a rebours est obligatoire.' };
  }

  const frequency = normalizeEnumValue(value.recurrence.frequency, COUNTDOWN_FREQUENCIES);
  const dayOfWeek = normalizeCountdownDay(value.recurrence.dayOfWeek);
  const time = normalizeCountdownTime(value.recurrence.time);

  if (!frequency) {
    return { error: 'La frequence du compte a rebours est invalide.' };
  }

  if (dayOfWeek === null) {
    return { error: 'Le jour de recurrence doit etre compris entre 0 et 6.' };
  }

  if (!time) {
    return { error: "L'heure de recurrence doit etre au format HH:MM." };
  }

  const appearance = normalizeCountdownAppearance(value.appearance);

  if (appearance.error) {
    return { error: appearance.error };
  }

  return {
    data: {
      title,
      type: 'RECURRING',
      recurrence: {
        frequency,
        dayOfWeek,
        time,
      },
      appearance,
    },
  };
};

const buildDefaultTestData = (size, position) => {
  const presets = TEST_WIDGET_PRESETS[size] || TEST_WIDGET_PRESETS.SQUARE;
  const preset = presets[position % presets.length];

  return {
    ...preset,
    badge: size === 'RECT' ? 'Rectangle' : 'Carre',
  };
};

const WIDGET_TYPE_DEFINITIONS = {
  TEST: {
    buildDefaultData: ({ size, position }) => buildDefaultTestData(size, position),
  },
  COUNTDOWN: {
    requiresData: true,
    requiredDataMessage: 'Le widget COUNTDOWN doit contenir une configuration.',
    normalizeData: normalizeCountdownData,
  },
};

const normalizeWidgetDataForPersist = ({ type, size, rawData, position = 0 }) => {
  if (rawData !== undefined && rawData !== null && !isPlainObject(rawData)) {
    return { error: 'Le champ data doit etre un objet JSON.' };
  }

  const definition = WIDGET_TYPE_DEFINITIONS[type];

  if (definition?.normalizeData) {
    if ((rawData === undefined || rawData === null) && definition.requiresData) {
      return { error: definition.requiredDataMessage };
    }

    return definition.normalizeData(rawData);
  }

  if (rawData !== undefined && rawData !== null) {
    return { data: rawData };
  }

  if (typeof definition?.buildDefaultData === 'function') {
    return { data: definition.buildDefaultData({ size, position }) };
  }

  return { data: null };
};

module.exports = {
  WIDGET_TYPES,
  WIDGET_SIZES,
  normalizeWidgetDataForPersist,
};
