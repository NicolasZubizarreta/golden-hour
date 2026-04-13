import { useEffect, useRef } from 'react';

export default function WidgetCardShell({
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
  canEdit = false,
  onEdit = () => {},
  typeLabel,
  showTypeLabel = true,
  showMobileEdit = true,
  overlay = null,
  overlayControls = false,
  fullBleedContent = false,
  style,
  className = '',
  controlsTone = 'light',
  children,
}) {
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
  const showMobileEditButton = showMobileEdit && canEdit && canManageWidgets && isMobileViewport && isMobileEditMode;
  const showMobileDeleteButton = showMobileDelete && canManageWidgets && isMobileViewport && isMobileEditMode;
  const renderHeaderRow = !overlayControls && (showTypeLabel || showDesktopControls);

  const toneClasses = controlsTone === 'dark'
    ? {
        chip: 'bg-black/8 text-gray-900',
        button: 'bg-black/8 text-gray-900 hover:bg-black/14',
        mobileButton: 'bg-white/70 text-gray-900',
      }
    : {
        chip: 'bg-black/10 text-white',
        button: 'bg-black/10 text-white hover:bg-black/20',
        mobileButton: 'bg-black/20 text-white',
      };

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
      className={`relative h-full w-full overflow-hidden rounded-golden border border-white/25 ${fullBleedContent ? 'p-0' : 'p-6'} shadow-halo transition-all duration-200 select-none ${isDragging ? 'scale-[1.02] shadow-halo z-50' : ''} ${isMobileViewport && isMobileEditMode && !isDragging ? 'widget-edit-jiggle cursor-grab active:cursor-grabbing' : ''} ${className}`}
      style={{
        ...style,
        touchAction: isMobileViewport ? (isMobileEditMode ? 'none' : 'pan-y') : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {overlay}

      <div className="relative z-10 flex h-full flex-col">
        {renderHeaderRow && (
          <div className="flex items-start justify-between gap-3">
            {showTypeLabel ? (
              <div className={`rounded-golden px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] backdrop-blur-sm shadow-halo ${toneClasses.chip}`}>
                {typeLabel}
              </div>
            ) : <div />}

            {showDesktopControls && (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    onPointerDown={(event) => event.stopPropagation()}
                    className={`rounded-golden p-2 backdrop-blur-sm shadow-halo transition cursor-pointer ${toneClasses.button}`}
                    aria-label="Modifier le widget"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z"></path></svg>
                  </button>
                )}

                {canDrag && (
                  <button
                    type="button"
                    className={`rounded-golden p-2 backdrop-blur-sm shadow-halo cursor-grab active:cursor-grabbing transition ${toneClasses.button}`}
                    aria-label="Deplacer le widget"
                    {...handleDragButtonProps}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDelete}
                  onPointerDown={(event) => event.stopPropagation()}
                  disabled={isDeleting}
                  className={`${toneClasses.button} rounded-golden p-2 backdrop-blur-sm shadow-halo disabled:opacity-50 hover:bg-red-500/80 hover:text-white transition cursor-pointer`}
                  aria-label="Supprimer le widget"
                >
                  {isDeleting ? '...' : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
                </button>
              </div>
            )}
          </div>
        )}

        {overlayControls && showDesktopControls && (
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                onPointerDown={(event) => event.stopPropagation()}
                className={`rounded-golden p-2 backdrop-blur-sm shadow-halo transition cursor-pointer ${toneClasses.button}`}
                aria-label="Modifier le widget"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z"></path></svg>
              </button>
            )}

            {canDrag && (
              <button
                type="button"
                className={`rounded-golden p-2 backdrop-blur-sm shadow-halo cursor-grab active:cursor-grabbing transition ${toneClasses.button}`}
                aria-label="Deplacer le widget"
                {...handleDragButtonProps}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
              </button>
            )}

            <button
              type="button"
              onClick={onDelete}
              onPointerDown={(event) => event.stopPropagation()}
              disabled={isDeleting}
              className={`${toneClasses.button} rounded-golden p-2 backdrop-blur-sm shadow-halo disabled:opacity-50 hover:bg-red-500/80 hover:text-white transition cursor-pointer`}
              aria-label="Supprimer le widget"
            >
              {isDeleting ? '...' : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
            </button>
          </div>
        )}

        {showMobileEditButton && (
          <button
            type="button"
            onClick={onEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className={`absolute right-11 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-golden backdrop-blur-sm shadow-halo transition cursor-pointer ${toneClasses.mobileButton}`}
            aria-label="Modifier le widget"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z"></path></svg>
          </button>
        )}

        {showMobileDeleteButton && (
          <button
            type="button"
            onClick={onDelete}
            onPointerDown={(event) => event.stopPropagation()}
            disabled={isDeleting}
            className={`absolute right-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-golden backdrop-blur-sm shadow-halo disabled:opacity-50 hover:bg-red-500/80 hover:text-white transition cursor-pointer ${toneClasses.mobileButton}`}
            aria-label="Supprimer le widget"
          >
            {isDeleting ? '...' : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
          </button>
        )}

        {fullBleedContent ? (
          <div className="relative min-h-0 flex-1">
            {children}
          </div>
        ) : children}
      </div>
    </article>
  );
}
