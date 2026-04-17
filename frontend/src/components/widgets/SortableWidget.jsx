import { useSortable } from '@dnd-kit/sortable';
import WidgetCard from './WidgetCard';
import { canEditWidgetType } from './widgetRegistry';
import WeatherWidgetCard from './WeatherWidget';

export default function SortableWidget({
  widget,
  groupMembers = [],
  canManageWidgets,
  canDrag,
  isActiveDrag,
  disableContentInteraction = false,
  isDeleting,
  isMobileViewport,
  isMobileEditMode,
  onEnterMobileEditMode,
  onDelete,
  onEdit,
}) {
  const renderWidgetCard = (cardProps) => {
    switch (widget.type) {
      case 'WEATHER':
        return <WeatherWidgetCard {...cardProps} />;
      default:
        return <WidgetCard {...cardProps} />;
    }
  };

  const canEditWidget = canEditWidgetType(widget.type);
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
      {renderWidgetCard({
        widget,
        groupMembers,
        canManageWidgets,
        canDrag,
        isMobileViewport,
        isMobileEditMode,
        showMobileDelete: false,
        showMobileEdit: false,
        onEnterMobileEditMode,
        dragAttributes: attributes,
        dragListeners: listeners,
        isDragging,
        isDeleting,
        disableContentInteraction,
        onDelete: () => onDelete(widget.id),
        canEdit: canEditWidget,
        onEdit: () => onEdit(widget),
      })}

      {canManageWidgets && isMobileViewport && isMobileEditMode && (
        <div className="absolute -right-3 -top-3 z-40 flex items-center gap-2">
          {canEditWidget && (
            <button
              type="button"
              onClick={() => onEdit(widget)}
              onPointerDownCapture={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-golden bg-white shadow-halo hover:bg-gray-100 transition cursor-pointer"
              aria-label="Modifier le widget"
            >
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.586 3.586a2 2 0 112.828 2.828L11 14.828 7 15l.172-4L16.586 3.586z"></path></svg>
            </button>
          )}

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
            className="flex h-10 w-10 items-center justify-center rounded-golden bg-white shadow-halo disabled:opacity-50 hover:bg-red-500 hover:text-white transition cursor-pointer"
            aria-label="Supprimer le widget"
          >
            {isDeleting ? '...' : <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>}
          </button>
        </div>
      )}
    </div>
  );
}
