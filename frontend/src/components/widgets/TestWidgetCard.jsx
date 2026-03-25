import { useEffect, useRef } from 'react';

const getWidgetText = (widget) => {
  const fallbackTitle = widget.size === 'RECT' ? 'Widget Large' : 'Widget Test';
  const fallbackSubtitle = widget.size === 'RECT' ? 'Deux colonnes' : 'Une colonne';

  if (!widget.data || typeof widget.data !== 'object' || Array.isArray(widget.data)) {
    return {
      title: fallbackTitle,
      subtitle: fallbackSubtitle,
      background: widget.size === 'RECT' ? '#1D4ED8' : '#F59E0B',
      text: widget.size === 'RECT' ? '#EFF6FF' : '#111827',
      badge: widget.size === 'RECT' ? 'RECT' : 'SQUARE',
    };
  }

  return {
    title: typeof widget.data.title === 'string' ? widget.data.title : fallbackTitle,
    subtitle: typeof widget.data.subtitle === 'string' ? widget.data.subtitle : fallbackSubtitle,
    background: typeof widget.data.background === 'string' ? widget.data.background : (widget.size === 'RECT' ? '#1D4ED8' : '#F59E0B'),
    text: typeof widget.data.text === 'string' ? widget.data.text : (widget.size === 'RECT' ? '#EFF6FF' : '#111827'),
    badge: typeof widget.data.badge === 'string' ? widget.data.badge : (widget.size === 'RECT' ? 'RECT' : 'SQUARE'),
  };
};

export default function TestWidgetCard({
  widget,
  canManageWidgets,
  canDrag,
  isMobileViewport = false,
  isMobileEditMode = false,
  showMobileDelete = true,
  onEnterMobileEditMode = () => {},
  dragAttributes,
  dragListeners,
  isDragging,
  isDeleting,
  onDelete,
}) {
  const content = getWidgetText(widget);
  const longPressTimeoutRef = useRef(null);
  const pointerStartRef = useRef(null);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pointerStartRef.current = null;
  };

  useEffect(() => () => clearLongPress(), []);

  const handlePointerDown = (event) => {
    if (!isMobileViewport || !canManageWidgets || isMobileEditMode || event.pointerType === 'mouse') return;

    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    longPressTimeoutRef.current = setTimeout(() => {
      onEnterMobileEditMode();
      clearLongPress();
    }, 2000);
  };

  const handlePointerMove = (event) => {
    if (!longPressTimeoutRef.current || !pointerStartRef.current) return;

    const moveX = Math.abs(event.clientX - pointerStartRef.current.x);
    const moveY = Math.abs(event.clientY - pointerStartRef.current.y);

    if (moveX > 10 || moveY > 10) {
      clearLongPress();
    }
  };

  const articleDragProps = isMobileViewport && isMobileEditMode && canDrag
    ? { ...dragAttributes, ...dragListeners }
    : {};

  const handleDragButtonProps = !isMobileViewport && canDrag
    ? { ...dragAttributes, ...dragListeners }
    : {};

  const showDesktopControls = canManageWidgets && !isMobileViewport;
  const showMobileDeleteButton = showMobileDelete && canManageWidgets && isMobileViewport && isMobileEditMode;

  return (
    <article
      {...articleDragProps}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onPointerLeave={clearLongPress}
      onContextMenu={isMobileViewport ? (event) => event.preventDefault() : undefined}
      onDragStart={(event) => event.preventDefault()}
      className={`relative w-full h-full overflow-hidden rounded-golden border border-white/25 p-6 shadow-halo transition-all duration-200 select-none ${isDragging ? 'scale-[1.02] shadow-halo z-50' : ''} ${isMobileViewport && isMobileEditMode && !isDragging ? 'widget-edit-jiggle cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        background: content.background,
        color: content.text,
        touchAction: isMobileViewport ? (isMobileEditMode ? 'none' : 'pan-y') : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.2),transparent_35%)] pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-golden bg-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] backdrop-blur-sm shadow-halo">
            {widget.type}
          </div>

          {showDesktopControls && (
            <div className="flex items-center gap-2">
              {canDrag && (
                <button
                  type="button"
                  className="rounded-golden bg-black/10 p-2 backdrop-blur-sm shadow-halo cursor-grab active:cursor-grabbing hover:bg-black/20 transition"
                  aria-label="Deplacer le widget"
                  {...handleDragButtonProps}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={isDeleting}
                className="rounded-golden bg-black/10 p-2 backdrop-blur-sm shadow-halo disabled:opacity-50 hover:bg-red-500/80 hover:text-white transition cursor-pointer"
                aria-label="Supprimer le widget"
              >
                {isDeleting ? '...' : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
              </button>
            </div>
          )}
        </div>

        {showMobileDeleteButton && (
          <button
            type="button"
            onClick={onDelete}
            onPointerDown={(event) => event.stopPropagation()}
            disabled={isDeleting}
            className="absolute right-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-golden bg-black/20 backdrop-blur-sm shadow-halo disabled:opacity-50 hover:bg-red-500/80 hover:text-white transition cursor-pointer"
            aria-label="Supprimer le widget"
          >
            {isDeleting ? '...' : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
          </button>
        )}

        <div className="mt-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-75">{content.badge}</p>
          <h3 className="mt-2 text-2xl font-black leading-tight tracking-wide">{content.title}</h3>
          <p className="mt-2 max-w-[16rem] text-sm opacity-85 font-medium">{content.subtitle}</p>
        </div>
      </div>
    </article>
  );
}

