export const MUSIC_PLATFORMS = {
  YOUTUBE_MUSIC: 'YOUTUBE_MUSIC',
  DEEZER: 'DEEZER',
};

const DEEZER_RESOURCE_TYPES = ['track', 'playlist', 'album', 'artist'];

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';

const getHostname = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const normalizeMusicPlatform = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();
  return Object.values(MUSIC_PLATFORMS).includes(normalizedValue) ? normalizedValue : null;
};

const normalizeYouTubeMusicVideoId = (value) => (
  typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value.trim()) ? value.trim() : null
);

const normalizeYouTubeMusicPlaylistId = (value) => (
  typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value.trim()) ? value.trim() : null
);

const parseYouTubeMusicUrl = (rawUrl) => {
  const normalizedUrl = normalizeText(rawUrl);

  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;
    const videoIdFromShort = hostname === 'youtu.be'
      ? normalizeYouTubeMusicVideoId(pathname.replace(/^\/+/, ''))
      : null;
    const videoId = videoIdFromShort || normalizeYouTubeMusicVideoId(parsedUrl.searchParams.get('v'));
    const playlistId = normalizeYouTubeMusicPlaylistId(parsedUrl.searchParams.get('list'));
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

    if ((pathname === '/playlist' || !videoId) && playlistId) {
      return {
        platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC,
        resourceType: 'playlist',
        resourceId: playlistId,
        shareUrl: `https://music.youtube.com/playlist?list=${playlistId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&rel=0&playsinline=1`,
      };
    }

    if (videoId) {
      return {
        platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC,
        resourceType: 'video',
        resourceId: videoId,
        shareUrl: `https://music.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`,
      };
    }
  } catch {
    return null;
  }

  return null;
};

const parseDeezerUrl = (rawUrl) => {
  const normalizedUrl = normalizeText(rawUrl);

  if (!normalizedUrl) {
    return null;
  }

  const deezerSharePattern = /^https?:\/\/(?:www\.)?deezer\.com\/(?:[a-z]{2}\/)?([a-z]+)\/(\d+)(?:\?.*)?$/i;
  const deezerEmbedPattern = /^https?:\/\/widget\.deezer\.com\/widget\/(?:dark|light)\/([a-z]+)\/(\d+)(?:\?.*)?$/i;
  const match = normalizedUrl.match(deezerSharePattern) || normalizedUrl.match(deezerEmbedPattern);

  if (!match) {
    return null;
  }

  const resourceType = match[1].toLowerCase();
  const resourceId = match[2];

  if (!DEEZER_RESOURCE_TYPES.includes(resourceType)) {
    return null;
  }

  return {
    platform: MUSIC_PLATFORMS.DEEZER,
    resourceType,
    resourceId,
    shareUrl: `https://www.deezer.com/${resourceType}/${resourceId}`,
    embedUrl: `https://widget.deezer.com/widget/dark/${resourceType}/${resourceId}`,
  };
};

const isResolvableDeezerShortUrl = (rawUrl) => {
  const hostname = getHostname(rawUrl);

  return (
    hostname === 'deezer.page.link'
    || hostname === 'dzr.page.link'
    || hostname === 'link.deezer.com'
  );
};

const parseMusicUrlForPlatform = (platform, rawUrl) => {
  if (platform === MUSIC_PLATFORMS.YOUTUBE_MUSIC) {
    return parseYouTubeMusicUrl(rawUrl);
  }

  if (platform === MUSIC_PLATFORMS.DEEZER) {
    return parseDeezerUrl(rawUrl);
  }

  return null;
};

export const createDefaultMusicDraft = () => ({
  platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC,
  url: '',
});

export const createMusicDraftFromData = (rawData) => {
  if (!isPlainObject(rawData)) {
    return createDefaultMusicDraft();
  }

  const platform = normalizeMusicPlatform(rawData.platform) || MUSIC_PLATFORMS.YOUTUBE_MUSIC;
  const parsedMusic = parseMusicUrlForPlatform(platform, rawData.url);

  return {
    platform,
    url: parsedMusic?.shareUrl || normalizeText(rawData.url),
  };
};

export const buildMusicPayloadFromDraft = (draft) => {
  if (!isPlainObject(draft)) {
    return { error: 'Configuration du widget musique invalide.' };
  }

  const platform = normalizeMusicPlatform(draft.platform);

  if (!platform) {
    return { error: 'La plateforme musicale est invalide.' };
  }

  const parsedMusic = parseMusicUrlForPlatform(platform, draft.url);

  const canResolveShortUrl = (
    platform === MUSIC_PLATFORMS.DEEZER && isResolvableDeezerShortUrl(draft.url)
  );

  if (!parsedMusic && !canResolveShortUrl) {
    return { error: 'Le lien fourni ne correspond pas a un lien valide pour cette plateforme.' };
  }

  return {
    payload: {
      platform,
      url: parsedMusic?.shareUrl || normalizeText(draft.url),
    },
  };
};

export const getMusicWidgetSnapshot = (rawData) => {
  if (!isPlainObject(rawData)) {
    return null;
  }

  const platform = normalizeMusicPlatform(rawData.platform);

  if (!platform) {
    return null;
  }

  return parseMusicUrlForPlatform(platform, rawData.url);
};
