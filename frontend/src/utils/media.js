import { API_ORIGIN } from '../api/axiosConfig';

export const getMediaUrl = (mediaPath) => {
  if (!mediaPath || typeof mediaPath !== 'string') {
    return null;
  }

  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }

  return `${API_ORIGIN}${mediaPath}`;
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};
