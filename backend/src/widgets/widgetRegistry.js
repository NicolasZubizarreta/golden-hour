const WIDGET_TYPES = ['TEST', 'NOTES', 'MAP', 'MUSIC', 'BUDGET', 'COUNTDOWN', 'TODO', 'CALENDAR', 'TRICOUNT', 'WEATHER', 'CHAT', 'SUMMARY'];
const WIDGET_SIZES = ['SQUARE', 'RECT'];
const COUNTDOWN_TYPES = ['SINGLE', 'RECURRING'];
const COUNTDOWN_FREQUENCIES = ['WEEKLY', 'MONTHLY_FIRST'];
const COUNTDOWN_APPEARANCE_TYPES = ['COLOR', 'IMAGE'];
const MUSIC_PLATFORMS = ['YOUTUBE_MUSIC', 'DEEZER'];

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
const fetchUrl = (...args) => {
  if (typeof fetch !== 'function') {
    return Promise.reject(new Error('Fetch indisponible.'));
  }

  return fetch(...args);
};

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

const parseMusicUrl = (platform, rawUrl) => {
  const normalizedUrl = normalizeTrimmedString(rawUrl);

  if (!normalizedUrl) {
    return null;
  }

  if (platform === 'YOUTUBE_MUSIC') {
    try {
      const parsedUrl = new URL(normalizedUrl);
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname;
      const videoId = hostname === 'youtu.be'
        ? pathname.replace(/^\/+/, '')
        : parsedUrl.searchParams.get('v');
      const playlistId = parsedUrl.searchParams.get('list');
      const isYouTubeHost = (
        hostname === 'music.youtube.com'
        || hostname === 'www.youtube.com'
        || hostname === 'youtube.com'
        || hostname === 'youtu.be'
        || hostname === 'm.youtube.com'
      );

      if (!isYouTubeHost) {
        return null;
      }

      if ((pathname === '/playlist' || !videoId) && typeof playlistId === 'string' && /^[A-Za-z0-9_-]+$/.test(playlistId)) {
        return `https://music.youtube.com/playlist?list=${playlistId}`;
      }

      if (typeof videoId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return `https://music.youtube.com/watch?v=${videoId}`;
      }
    } catch {
      return null;
    }

    return null;
  }

  if (platform === 'DEEZER') {
    const deezerSharePattern = /^https?:\/\/(?:www\.)?deezer\.com\/(?:[a-z]{2}\/)?([a-z]+)\/(\d+)(?:\?.*)?$/i;
    const deezerEmbedPattern = /^https?:\/\/widget\.deezer\.com\/widget\/(?:dark|light)\/([a-z]+)\/(\d+)(?:\?.*)?$/i;
    const deezerMatch = normalizedUrl.match(deezerSharePattern) || normalizedUrl.match(deezerEmbedPattern);

    if (!deezerMatch) {
      return null;
    }

    const resourceType = deezerMatch[1].toLowerCase();
    const resourceId = deezerMatch[2];

    if (!['track', 'playlist', 'album', 'artist'].includes(resourceType)) {
      return null;
    }

    return `https://www.deezer.com/${resourceType}/${resourceId}`;
  }

  return null;
};

const normalizeMusicData = (value) => {
  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget musique est invalide.' };
  }

  const platform = normalizeEnumValue(value.platform, MUSIC_PLATFORMS);

  if (!platform) {
    return { error: 'La plateforme du widget musique est invalide.' };
  }

  return normalizeMusicDataByPlatform(platform, value.url);
};

const getHostname = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const isResolvableDeezerShortUrl = (rawUrl) => {
  const hostname = getHostname(rawUrl);

  return (
    hostname === 'deezer.page.link'
    || hostname === 'dzr.page.link'
    || hostname === 'link.deezer.com'
  );
};

const resolveRedirectUrl = async (rawUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetchUrl(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'GoldenHour/1.0',
      },
    });

    return typeof response?.url === 'string' ? response.url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeMusicDataByPlatform = async (platform, rawUrl) => {
  const normalizedUrl = parseMusicUrl(platform, rawUrl);

  if (!normalizedUrl) {
    const canResolveShortUrl = (
      platform === 'DEEZER' && isResolvableDeezerShortUrl(rawUrl)
    );

    if (canResolveShortUrl) {
      const resolvedUrl = await resolveRedirectUrl(rawUrl);

      if (resolvedUrl) {
        const redirectedUrl = parseMusicUrl(platform, resolvedUrl);

        if (redirectedUrl) {
          return {
            data: {
              platform,
              url: redirectedUrl,
            },
          };
        }
      }
    }

    return { error: 'Le lien du widget musique est invalide pour cette plateforme.' };
  }

  return {
    data: {
      platform,
      url: normalizedUrl,
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

const normalizeSummaryData = (value) => {
  if (value === undefined || value === null) {
    return { data: { appearance: { backgroundType: 'COLOR', backgroundColor: '#3B1F07' } } };
  }

  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget résumé est invalide.' };
  }

  const appearance = normalizeCountdownAppearance(value.appearance);
  if (appearance.error) return { error: appearance.error };

  return { data: { appearance } };
};

const normalizeTricountData = (value) => {
  if (value === undefined || value === null) {
    return { data: { title: 'Tricount', currency: 'EUR' } };
  }

  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget Tricount est invalide.' };
  }

  const title = normalizeTrimmedString(value.title) || 'Tricount';
  const allowedCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'];
  const currency = allowedCurrencies.includes(value.currency) ? value.currency : 'EUR';

  return { data: { title, currency } };
};

const normalizeTricountSize = (size) => {
  if (size !== 'RECT') {
    return { error: 'Le widget TRICOUNT est disponible uniquement en format rectangle.' };
  }

  return null;
};

const normalizeCalendarData = (value) => {
  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget calendrier est invalide.' };
  }

  const title = normalizeTrimmedString(value.title);
  if (!title) {
    return { error: "Le titre du calendrier est obligatoire." };
  }

  return { data: { title } };
};

const normalizeTodoData = (value) => {
  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget todo est invalide.' };
  }

  const title = normalizeTrimmedString(value.title);
  if (!title) {
    return { error: 'Le titre de la liste de tâches est obligatoire.' };
  }

  return { data: { title } };
};

const normalizeMapData = (value) => {
  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget carte est invalide.' };
  }

  const title = normalizeTrimmedString(value.title);
  if (!title) {
    return { error: 'Le titre de la carte est obligatoire.' };
  }

  const rawLocations = Array.isArray(value.locations) ? value.locations : [];
  const locations = rawLocations
    .filter(
      (loc) =>
        isPlainObject(loc) &&
        typeof loc.lat === 'number' &&
        Number.isFinite(loc.lat) &&
        typeof loc.lng === 'number' &&
        Number.isFinite(loc.lng),
    )
    .map((loc) => ({
      id: normalizeTrimmedString(loc.id) || String(Math.random()),
      address: normalizeTrimmedString(loc.address),
      description: normalizeTrimmedString(loc.description) || normalizeTrimmedString(loc.address),
      lat: loc.lat,
      lng: loc.lng,
    }));

  return { data: { title, locations } };
};

const normalizeWeatherData = (value) => {
  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget meteo est invalide.' };
  }

  const city = normalizeTrimmedString(value.city);
  if (!city) {
    return { error: 'La ville du widget meteo est obligatoire.' };
  }

  return { data: { city } };
};

const normalizeChatData = (value) => {
  if (value === undefined || value === null) {
    return { data: { title: 'Chat du groupe' } };
  }

  if (!isPlainObject(value)) {
    return { error: 'La configuration du widget chat est invalide.' };
  }

  const title = normalizeTrimmedString(value.title) || 'Chat du groupe';

  if (title.length > 60) {
    return { error: 'Le titre du chat ne peut pas depasser 60 caracteres.' };
  }

  return { data: { title } };
};

const normalizeMapSize = (size) => {
  if (size !== 'RECT') {
    return { error: 'Le widget MAP est disponible uniquement en format rectangle.' };
  }

  return null;
};

const normalizeTodoSize = (size) => {
  if (size !== 'SQUARE') {
    return { error: 'Le widget TODO est disponible uniquement en format carré.' };
  }

  return null;
};

const normalizeChatSize = (size) => {
  if (size !== 'RECT') {
    return { error: 'Le widget CHAT est disponible uniquement en format rectangle.' };
  }

  return null;
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
  MUSIC: {
    requiresData: true,
    requiredDataMessage: 'Le widget MUSIC doit contenir une configuration.',
    normalizeData: normalizeMusicData,
  },
  MAP: {
    requiresData: true,
    requiredDataMessage: 'Le widget MAP doit contenir un titre.',
    validateSize: normalizeMapSize,
    normalizeData: normalizeMapData,
  },
  TRICOUNT: {
    validateSize: normalizeTricountSize,
    normalizeData: normalizeTricountData,
  },
  TODO: {
    requiresData: true,
    requiredDataMessage: 'Le widget TODO doit contenir un titre.',
    validateSize: normalizeTodoSize,
    normalizeData: normalizeTodoData,
  },
  WEATHER: {
    requiresData: true,
    requiredDataMessage: 'Le widget WEATHER doit contenir une ville.',
    normalizeData: normalizeWeatherData,
  },
  SUMMARY: {
    normalizeData: normalizeSummaryData,
  },
  CALENDAR: {
    requiresData: true,
    requiredDataMessage: 'Le widget CALENDAR doit contenir un titre.',
    normalizeData: normalizeCalendarData,
  },
  CHAT: {
    validateSize: normalizeChatSize,
    normalizeData: normalizeChatData,
  },
};

const normalizeWidgetDataForPersist = async ({ type, size, rawData, position = 0 }) => {
  if (rawData !== undefined && rawData !== null && !isPlainObject(rawData)) {
    return { error: 'Le champ data doit etre un objet JSON.' };
  }

  const definition = WIDGET_TYPE_DEFINITIONS[type];

  if (typeof definition?.validateSize === 'function') {
    const sizeValidation = definition.validateSize(size);

    if (sizeValidation?.error) {
      return sizeValidation;
    }
  }

  if (definition?.normalizeData) {
    if ((rawData === undefined || rawData === null) && definition.requiresData) {
      return { error: definition.requiredDataMessage };
    }

    return definition.normalizeData(rawData, { size, position });
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
