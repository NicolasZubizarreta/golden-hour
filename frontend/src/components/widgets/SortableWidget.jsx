import { useSortable } from '@dnd-kit/sortable';
import TestWidgetCard from './TestWidgetCard';

export default function SortableWidget({
  widget,
  canManageWidgets,
  canDrag,
  isActiveDrag,
  isDeleting,
  isMobileViewport,
  isMobileEditMode,
  onEnterMobileEditMode,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !canDrag,
  });

  const translateX = transform?.x ?? 0;
  const translateY = transform?.y ?? 0;

  const style = {
    transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isActiveDrag ? 0.18 : 1,
    touchAction: isMobileViewport ? (isMobileEditMode ? 'none' : 'pan-y') : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-full self-start overflow-visible ${widget.size === 'RECT' ? 'col-span-2 aspect-[2.08/1]' : 'col-span-1 aspect-square'} ${isActiveDrag ? 'pointer-events-none' : ''}`}
    >
      <TestWidgetCard
        widget={widget}
        canManageWidgets={canManageWidgets}
        canDrag={canDrag}
        isMobileViewport={isMobileViewport}
        isMobileEditMode={isMobileEditMode}
        showMobileDelete={false}
        onEnterMobileEditMode={onEnterMobileEditMode}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
        isDeleting={isDeleting}
        onDelete={() => onDelete(widget.id)}
      />

      {canManageWidgets && isMobileViewport && isMobileEditMode && (
        <button
          type="button"
          onClick={() => onDelete(widget.id)}
          onPointerDownCapture={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          disabled={isDeleting}
          className="absolute -right-3 -top-3 z-40 flex h-10 w-10 items-center justify-center rounded-golden bg-white shadow-halo disabled:opacity-50 hover:bg-red-500 hover:text-white transition cursor-pointer"
          aria-label="Supprimer le widget"
        >
          {isDeleting ? '...' : <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>}
        </button>
      )}
    </div>
  );
}

