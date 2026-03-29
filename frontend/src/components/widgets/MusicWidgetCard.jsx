import { useEffect, useMemo, useRef, useState } from 'react';
import WidgetCardShell from './WidgetCardShell';
import { MUSIC_PLATFORMS, getMusicWidgetSnapshot } from '../../utils/musicWidget';

const PLATFORM_THEMES = {
  [MUSIC_PLATFORMS.YOUTUBE_MUSIC]: {
    background: 'linear-gradient(135deg, #1f1f1f 0%, #ff0033 55%, #111827 100%)',
    embedBackground: '#0f0f0f',
    color: '#F8FAFC',
    label: 'YouTube Music',
    emptyState: 'Colle un lien YouTube Music pour previsualiser le lecteur.',
  },
  [MUSIC_PLATFORMS.DEEZER]: {
    background: 'linear-gradient(135deg, #18181b 0%, #312e81 48%, #7c3aed 100%)',
    embedBackground: '#141414',
    color: '#F8FAFC',
    label: 'Deezer',
    emptyState: 'Colle un lien Deezer pour previsualiser le lecteur.',
  },
};

const normalizePlatform = (value) => (
  typeof value === 'string' && Object.values(MUSIC_PLATFORMS).includes(value.trim().toUpperCase())
    ? value.trim().toUpperCase()
    : MUSIC_PLATFORMS.YOUTUBE_MUSIC
);

const getEmbedFrameSize = (snapshot, widgetSize) => {
  if (widgetSize === 'RECT') {
    if (snapshot?.platform === MUSIC_PLATFORMS.YOUTUBE_MUSIC) {
      return { width: 640, height: 308 };
    }

    return { width: 640, height: 308 };
  }

  return { width: 320, height: 320 };
};

const MusicPlaceholder = ({ label, message }) => (
  <div className="flex h-full flex-col items-start justify-between rounded-golden bg-black/12 px-5 py-5">
    <div className="inline-flex items-center rounded-golden bg-white/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-halo">
      {label}
    </div>
    <div className="w-full">
      <p className="text-[clamp(1rem,3.3vw,1.35rem)] font-outfit font-black leading-tight text-white">
        Widget musique
      </p>
      <p className="mt-2 text-sm font-medium text-white/80">
        {message}
      </p>
    </div>
  </div>
);

export default function MusicWidgetCard(props) {
  const {
    widget,
    disableContentInteraction = false,
    canManageWidgets = false,
    isMobileViewport = false,
  } = props;
  const snapshot = getMusicWidgetSnapshot(widget.data);
  const platform = normalizePlatform(widget.data?.platform);
  const theme = PLATFORM_THEMES[platform] || PLATFORM_THEMES[MUSIC_PLATFORMS.YOUTUBE_MUSIC];
  const shouldDisableEmbedInteraction = disableContentInteraction || (isMobileViewport && canManageWidgets);
  const frameRef = useRef(null);
  const [frameBounds, setFrameBounds] = useState({ width: 0, height: 0 });
  const embedFrameSize = useMemo(
    () => getEmbedFrameSize(snapshot, widget.size),
    [snapshot, widget.size]
  );
  const shellStyle = snapshot
    ? { backgroundColor: theme.embedBackground, color: theme.color }
    : { background: theme.background, color: theme.color };

  useEffect(() => {
    if (!snapshot || !frameRef.current || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const node = frameRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry?.contentRect) {
        return;
      }

      setFrameBounds({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [snapshot]);

  const embedScale = useMemo(() => {
    if (!snapshot || !frameBounds.width || !frameBounds.height) {
      return 1;
    }

    const widthScale = frameBounds.width / embedFrameSize.width;
    const heightScale = frameBounds.height / embedFrameSize.height;

    return Math.min(widthScale, heightScale) + 0.002;
  }, [embedFrameSize.height, embedFrameSize.width, frameBounds.height, frameBounds.width, snapshot]);

  return (
    <WidgetCardShell
      {...props}
      showTypeLabel={false}
      overlayControls
      fullBleedContent
      className="border-0"
      style={shellStyle}
      controlsTone="light"
      overlay={snapshot ? null : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.22))] pointer-events-none" />}
    >
      {snapshot ? (
        <div
          ref={frameRef}
          className="relative h-full w-full min-h-0 flex-1 overflow-hidden"
          style={{ backgroundColor: theme.embedBackground }}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${embedFrameSize.width}px`,
              height: `${embedFrameSize.height}px`,
              transform: `translate(-50%, -50%) scale(${embedScale})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            <iframe
              src={snapshot.embedUrl}
              title={`Lecteur ${theme.label}`}
              className={`block h-full w-full border-0 ${shouldDisableEmbedInteraction ? 'pointer-events-none' : ''}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        </div>
      ) : (
        <div className="h-full w-full min-h-0 flex-1">
          <MusicPlaceholder label={theme.label} message={theme.emptyState} />
        </div>
      )}
    </WidgetCardShell>
  );
}
