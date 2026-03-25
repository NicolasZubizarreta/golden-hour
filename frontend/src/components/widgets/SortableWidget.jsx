import { useSortable } from '@dnd-kit/sortable';
import TestWidgetCard from './TestWidgetCard';

export default function SortableWidget({
  widget,
  canManageWidgets,
  canDrag,
  isActiveDrag,
  isDeleting,
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // MAGIE ICI : aspect-[2.08/1] pour le RECT, aspect-square pour le CARRE
      className={`w-full h-full ${widget.size === 'RECT' ? 'col-span-2 aspect-[2.08/1]' : 'col-span-1 aspect-square'} ${isActiveDrag ? 'pointer-events-none' : ''}`}
    >
      <TestWidgetCard
        widget={widget}
        canManageWidgets={canManageWidgets}
        canDrag={canDrag}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
        isDeleting={isDeleting}
        onDelete={() => onDelete(widget.id)}
      />
    </div>
  );
}