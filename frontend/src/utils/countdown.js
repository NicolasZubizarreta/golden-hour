export const COUNTDOWN_TYPES = {
  SINGLE: 'SINGLE',
  RECURRING: 'RECURRING',
};

export const COUNTDOWN_FREQUENCIES = {
  WEEKLY: 'WEEKLY',
  MONTHLY_FIRST: 'MONTHLY_FIRST',
};

export const COUNTDOWN_APPEARANCE_TYPES = {
  COLOR: 'COLOR',
  IMAGE: 'IMAGE',
};

export const WEEK_DAYS = [
  { value: 0, label: 'Dimanche', shortLabel: 'Dim' },
  { value: 1, label: 'Lundi', shortLabel: 'Lun' },
  { value: 2, label: 'Mardi', shortLabel: 'Mar' },
  { value: 3, label: 'Mercredi', shortLabel: 'Mer' },
  { value: 4, label: 'Jeudi', shortLabel: 'Jeu' },
  { value: 5, label: 'Vendredi', shortLabel: 'Ven' },
  { value: 6, label: 'Samedi', shortLabel: 'Sam' },
];

const LONG_WEEK_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const LONG_MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const padNumber = (value) => String(value).padStart(2, '0');

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';

const isValidHexColor = (value) => typeof value === 'string' && /^#([0-9a-fA-F]{6})$/.test(value.trim());

const normalizeEnum = (value, allowedValues) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return allowedValues.includes(normalized) ? normalized : null;
};

const parseTimeString = (value) => {
  if (typeof value !== 'string') return null;

  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
    time: `${match[1]}:${match[2]}`,
  };
};

const parseDayOfWeek = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }

  if (typeof value === 'string' && /^\d$/.test(value)) {
    const parsedValue = Number(value);
    return parsedValue >= 0 && parsedValue <= 6 ? parsedValue : null;
  }

  return null;
};

const parseDateInput = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsedDate = new Date(value);
  return isValidDate(parsedDate) ? parsedDate : null;
};

const getFirstWeekdayOfMonth = (year, monthIndex, dayOfWeek, hours, minutes) => {
  const firstDay = new Date(year, monthIndex, 1, hours, minutes, 0, 0);
  const offset = (dayOfWeek - firstDay.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + offset, hours, minutes, 0, 0);
};

const getMonthOffset = (date, monthOffset) => {
  let year = date.getFullYear();
  let monthIndex = date.getMonth() + monthOffset;

  while (monthIndex < 0) {
    monthIndex += 12;
    year -= 1;
  }

  while (monthIndex > 11) {
    monthIndex -= 12;
    year += 1;
  }

  return { year, monthIndex };
};

const normalizeAppearanceFromDraft = (draft) => {
  const backgroundType = normalizeEnum(draft.backgroundType, Object.values(COUNTDOWN_APPEARANCE_TYPES))
    || COUNTDOWN_APPEARANCE_TYPES.COLOR;

  if (backgroundType === COUNTDOWN_APPEARANCE_TYPES.IMAGE) {
    const backgroundImage = normalizeText(draft.backgroundImage);

    if (!backgroundImage) {
      return { error: "L'image de fond est obligatoire." };
    }

    return {
      appearance: {
        backgroundType: COUNTDOWN_APPEARANCE_TYPES.IMAGE,
        backgroundImage,
      },
    };
  }

  const backgroundColor = isValidHexColor(draft.backgroundColor)
    ? draft.backgroundColor.trim()
    : '#EA580C';

  return {
    appearance: {
      backgroundType: COUNTDOWN_APPEARANCE_TYPES.COLOR,
      backgroundColor,
    },
  };
};

const normalizeAppearanceFromWidgetData = (value) => {
  if (!isPlainObject(value)) {
    return {
      backgroundType: COUNTDOWN_APPEARANCE_TYPES.COLOR,
      backgroundColor: '#EA580C',
    };
  }

  const backgroundType = normalizeEnum(value.backgroundType, Object.values(COUNTDOWN_APPEARANCE_TYPES))
    || COUNTDOWN_APPEARANCE_TYPES.COLOR;

  if (backgroundType === COUNTDOWN_APPEARANCE_TYPES.IMAGE) {
    const backgroundImage = normalizeText(value.backgroundImage);

    if (backgroundImage) {
      return {
        backgroundType: COUNTDOWN_APPEARANCE_TYPES.IMAGE,
        backgroundImage,
      };
    }
  }

  return {
    backgroundType: COUNTDOWN_APPEARANCE_TYPES.COLOR,
    backgroundColor: isValidHexColor(value.backgroundColor) ? value.backgroundColor.trim() : '#EA580C',
  };
};

const getModuloProgress = (remainingMs, unitMs) => {
  if (remainingMs <= 0) return 0;

  const remainder = remainingMs % unitMs;
  if (remainder === 0) {
    return 1;
  }

  return clamp(remainder / unitMs);
};

export const formatDateTimeInputValue = (date) => {
  if (!isValidDate(date)) return '';

  return [
    `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`,
    `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`,
  ].join('T');
};

export const createDefaultCountdownDraft = () => {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  defaultDate.setHours(20, 0, 0, 0);

  return {
    title: '',
    type: COUNTDOWN_TYPES.SINGLE,
    targetDateInput: formatDateTimeInputValue(defaultDate),
    startedAt: new Date().toISOString(),
    frequency: COUNTDOWN_FREQUENCIES.WEEKLY,
    dayOfWeek: '6',
    time: '20:00',
    backgroundType: COUNTDOWN_APPEARANCE_TYPES.COLOR,
    backgroundColor: '#EA580C',
    backgroundImage: '',
  };
};

export const createCountdownDraftFromData = (rawData) => {
  const fallbackDraft = createDefaultCountdownDraft();
  const normalizedData = normalizeCountdownWidgetData(rawData);

  if (!normalizedData) {
    return fallbackDraft;
  }

  if (normalizedData.type === COUNTDOWN_TYPES.SINGLE) {
    return {
      ...fallbackDraft,
      title: normalizedData.title,
      type: COUNTDOWN_TYPES.SINGLE,
      targetDateInput: formatDateTimeInputValue(new Date(normalizedData.targetDate)),
      startedAt: normalizedData.startedAt || fallbackDraft.startedAt,
      backgroundType: normalizedData.appearance?.backgroundType || fallbackDraft.backgroundType,
      backgroundColor: normalizedData.appearance?.backgroundColor || fallbackDraft.backgroundColor,
      backgroundImage: normalizedData.appearance?.backgroundImage || '',
    };
  }

  return {
    ...fallbackDraft,
    title: normalizedData.title,
    type: COUNTDOWN_TYPES.RECURRING,
    frequency: normalizedData.recurrence.frequency,
    dayOfWeek: String(normalizedData.recurrence.dayOfWeek),
    time: normalizedData.recurrence.time,
    backgroundType: normalizedData.appearance?.backgroundType || fallbackDraft.backgroundType,
    backgroundColor: normalizedData.appearance?.backgroundColor || fallbackDraft.backgroundColor,
    backgroundImage: normalizedData.appearance?.backgroundImage || '',
  };
};

export const buildCountdownPayloadFromDraft = (draft) => {
  if (!isPlainObject(draft)) {
    return { error: 'Configuration du widget invalide.' };
  }

  const title = normalizeText(draft.title);
  if (!title) {
    return { error: 'Le titre du compte a rebours est obligatoire.' };
  }

  const countdownType = normalizeEnum(draft.type, Object.values(COUNTDOWN_TYPES));
  if (!countdownType) {
    return { error: "Le type d'evenement est invalide." };
  }

  const normalizedAppearance = normalizeAppearanceFromDraft(draft);
  if (normalizedAppearance.error) {
    return { error: normalizedAppearance.error };
  }

  if (countdownType === COUNTDOWN_TYPES.SINGLE) {
    const parsedDate = parseDateInput(draft.targetDateInput);

    if (!parsedDate) {
      return { error: "La date de l'evenement est invalide." };
    }

    const startedAt = parseDateInput(draft.startedAt)?.toISOString() || new Date().toISOString();

    return {
      payload: {
        title,
        type: COUNTDOWN_TYPES.SINGLE,
        targetDate: parsedDate.toISOString(),
        startedAt,
        appearance: normalizedAppearance.appearance,
      },
    };
  }

  const frequency = normalizeEnum(draft.frequency, Object.values(COUNTDOWN_FREQUENCIES));
  const dayOfWeek = parseDayOfWeek(draft.dayOfWeek);
  const parsedTime = parseTimeString(draft.time);

  if (!frequency) {
    return { error: 'La frequence est invalide.' };
  }

  if (dayOfWeek === null) {
    return { error: 'Le jour selectionne est invalide.' };
  }

  if (!parsedTime) {
    return { error: "L'heure selectionnee est invalide." };
  }

  return {
    payload: {
      title,
      type: COUNTDOWN_TYPES.RECURRING,
      recurrence: {
        frequency,
        dayOfWeek,
        time: parsedTime.time,
      },
      appearance: normalizedAppearance.appearance,
    },
  };
};

export const getPreviewCountdownData = (draft) => {
  const draftData = isPlainObject(draft) ? draft : {};
  const previewTitle = normalizeText(draftData.title) || 'Nouvel evenement';
  const previewType = normalizeEnum(draftData.type, Object.values(COUNTDOWN_TYPES)) || COUNTDOWN_TYPES.SINGLE;
  const normalizedAppearance = normalizeAppearanceFromDraft(draftData);

  if (previewType === COUNTDOWN_TYPES.SINGLE) {
    const previewDate = parseDateInput(draftData.targetDateInput) || (() => {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 5);
      fallbackDate.setHours(20, 0, 0, 0);
      return fallbackDate;
    })();

    return {
      title: previewTitle,
      type: COUNTDOWN_TYPES.SINGLE,
      targetDate: previewDate.toISOString(),
      startedAt: parseDateInput(draftData.startedAt)?.toISOString() || new Date().toISOString(),
      appearance: normalizedAppearance.appearance,
    };
  }

  const frequency = normalizeEnum(draftData.frequency, Object.values(COUNTDOWN_FREQUENCIES)) || COUNTDOWN_FREQUENCIES.WEEKLY;
  const dayOfWeek = parseDayOfWeek(draftData.dayOfWeek) ?? 6;
  const parsedTime = parseTimeString(draftData.time) || { time: '20:00' };

  return {
    title: previewTitle,
    type: COUNTDOWN_TYPES.RECURRING,
    recurrence: {
      frequency,
      dayOfWeek,
      time: parsedTime.time,
    },
    appearance: normalizedAppearance.appearance,
  };
};

export const normalizeCountdownWidgetData = (value) => {
  if (!isPlainObject(value)) return null;

  const title = normalizeText(value.title) || 'Compte a rebours';
  const countdownType = normalizeEnum(value.type, Object.values(COUNTDOWN_TYPES));

  if (countdownType === COUNTDOWN_TYPES.SINGLE) {
    const parsedDate = parseDateInput(value.targetDate);
    if (!parsedDate) return null;

    return {
      title,
      type: COUNTDOWN_TYPES.SINGLE,
      targetDate: parsedDate.toISOString(),
      startedAt: parseDateInput(value.startedAt)?.toISOString() || new Date().toISOString(),
      appearance: normalizeAppearanceFromWidgetData(value.appearance),
    };
  }

  if (countdownType === COUNTDOWN_TYPES.RECURRING && isPlainObject(value.recurrence)) {
    const frequency = normalizeEnum(value.recurrence.frequency, Object.values(COUNTDOWN_FREQUENCIES));
    const dayOfWeek = parseDayOfWeek(value.recurrence.dayOfWeek);
    const parsedTime = parseTimeString(value.recurrence.time);

    if (!frequency || dayOfWeek === null || !parsedTime) return null;

    return {
      title,
      type: COUNTDOWN_TYPES.RECURRING,
      recurrence: {
        frequency,
        dayOfWeek,
        time: parsedTime.time,
      },
      appearance: normalizeAppearanceFromWidgetData(value.appearance),
    };
  }

  return null;
};

export const calculateNextOccurrence = (recurrence, fromDate = new Date()) => {
  const normalizedData = normalizeCountdownWidgetData({
    title: 'recurrence',
    type: COUNTDOWN_TYPES.RECURRING,
    recurrence,
  });

  if (!normalizedData || !isValidDate(fromDate)) return null;

  const timeParts = parseTimeString(normalizedData.recurrence.time);
  if (!timeParts) return null;

  if (normalizedData.recurrence.frequency === COUNTDOWN_FREQUENCIES.WEEKLY) {
    const candidateDate = new Date(fromDate);
    candidateDate.setHours(timeParts.hours, timeParts.minutes, 0, 0);

    const dayOffset = (normalizedData.recurrence.dayOfWeek - candidateDate.getDay() + 7) % 7;
    candidateDate.setDate(candidateDate.getDate() + dayOffset);

    if (candidateDate <= fromDate) {
      candidateDate.setDate(candidateDate.getDate() + 7);
    }

    return candidateDate;
  }

  let year = fromDate.getFullYear();
  let monthIndex = fromDate.getMonth();
  let candidateDate = getFirstWeekdayOfMonth(
    year,
    monthIndex,
    normalizedData.recurrence.dayOfWeek,
    timeParts.hours,
    timeParts.minutes
  );

  if (candidateDate <= fromDate) {
    const nextMonth = getMonthOffset(fromDate, 1);
    candidateDate = getFirstWeekdayOfMonth(
      nextMonth.year,
      nextMonth.monthIndex,
      normalizedData.recurrence.dayOfWeek,
      timeParts.hours,
      timeParts.minutes
    );
  }

  return candidateDate;
};

export const calculatePreviousOccurrence = (recurrence, nextOccurrence) => {
  const normalizedData = normalizeCountdownWidgetData({
    title: 'recurrence',
    type: COUNTDOWN_TYPES.RECURRING,
    recurrence,
  });

  if (!normalizedData || !isValidDate(nextOccurrence)) return null;

  const timeParts = parseTimeString(normalizedData.recurrence.time);
  if (!timeParts) return null;

  if (normalizedData.recurrence.frequency === COUNTDOWN_FREQUENCIES.WEEKLY) {
    return new Date(nextOccurrence.getTime() - (7 * DAY_MS));
  }

  const previousMonth = getMonthOffset(nextOccurrence, -1);
  return getFirstWeekdayOfMonth(
    previousMonth.year,
    previousMonth.monthIndex,
    normalizedData.recurrence.dayOfWeek,
    timeParts.hours,
    timeParts.minutes
  );
};

export const getCountdownSnapshot = (rawData, now = new Date()) => {
  const data = normalizeCountdownWidgetData(rawData);

  if (!data || !isValidDate(now)) return null;

  if (data.type === COUNTDOWN_TYPES.SINGLE) {
    const targetDate = new Date(data.targetDate);
    const remainingMs = Math.max(targetDate.getTime() - now.getTime(), 0);

    return {
      ...data,
      targetDate,
      remainingMs,
      isRecurring: false,
      isComplete: remainingMs === 0,
    };
  }

  const targetDate = calculateNextOccurrence(data.recurrence, now);
  if (!targetDate) return null;

  return {
    ...data,
    targetDate,
    remainingMs: Math.max(targetDate.getTime() - now.getTime(), 0),
    isRecurring: true,
    isComplete: false,
  };
};

export const getCountdownUnits = (remainingMs) => {
  const safeMs = Math.max(remainingMs, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
  };
};

export const getCompactCountdown = (units, isComplete = false) => {
  if (isComplete) {
    return {
      value: 'J-0',
      label: 'Termine',
    };
  }

  return {
    value: `J-${Math.max(units.days, 0)}`,
    label: `${padNumber(units.hours)}:${padNumber(units.minutes)}:${padNumber(units.seconds)}`,
  };
};

export const formatCountdownDate = (date) => {
  if (!isValidDate(date)) return '';

  return `${LONG_WEEK_DAYS[date.getDay()]} ${date.getDate()} ${LONG_MONTHS[date.getMonth()]} a ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
};

export const getRecurrenceDescription = (recurrence) => {
  const normalizedData = normalizeCountdownWidgetData({
    title: 'recurrence',
    type: COUNTDOWN_TYPES.RECURRING,
    recurrence,
  });

  if (!normalizedData) return '';

  const day = WEEK_DAYS.find((entry) => entry.value === normalizedData.recurrence.dayOfWeek);
  const time = normalizedData.recurrence.time;

  if (normalizedData.recurrence.frequency === COUNTDOWN_FREQUENCIES.WEEKLY) {
    return `Chaque ${day?.label?.toLowerCase() || 'jour'} a ${time}`;
  }

  return `Le 1er ${day?.label?.toLowerCase() || 'jour'} de chaque mois a ${time}`;
};

export const getCountdownProgressData = (rawData, now = new Date()) => {
  const snapshot = getCountdownSnapshot(rawData, now);

  if (!snapshot) return null;

  const units = getCountdownUnits(snapshot.remainingMs);
  const cycleStart = snapshot.isRecurring
    ? calculatePreviousOccurrence(snapshot.recurrence, snapshot.targetDate)
    : parseDateInput(snapshot.startedAt);
  const cycleDurationMs = cycleStart && isValidDate(cycleStart)
    ? Math.max(snapshot.targetDate.getTime() - cycleStart.getTime(), SECOND_MS)
    : Math.max(snapshot.remainingMs, SECOND_MS);

  return {
    snapshot,
    units,
    progress: {
      days: clamp(snapshot.remainingMs / cycleDurationMs),
      hours: getModuloProgress(snapshot.remainingMs, DAY_MS),
      minutes: getModuloProgress(snapshot.remainingMs, HOUR_MS),
      seconds: getModuloProgress(snapshot.remainingMs, MINUTE_MS),
    },
  };
};
