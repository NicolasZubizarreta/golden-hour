import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortableWidget from './SortableWidget';
import TestWidgetCard from './TestWidgetCard';

export default function WidgetGrid({
  widgets,
  canManageWidgets,
  isReordering,
  deletingWidgetId,
  onDeleteWidget,
  onReorderWidgets,
}) {
  const canDrag = canManageWidgets && !isReordering;
  const [activeWidgetId, setActiveWidgetId] = useState(null);
  const [activeWidgetRect, setActiveWidgetRect] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const nextActiveId = Number(event.active.id);
    setActiveWidgetId(nextActiveId);

    const initialRect = event.active.rect.current.initial;

    if (initialRect?.width && initialRect?.height) {
      setActiveWidgetRect({
        width: initialRect.width,
        height: initialRect.height,
      });
    } else {
      setActiveWidgetRect(null);
    }
  };

  const handleDragCancel = () => {
    setActiveWidgetId(null);
    setActiveWidgetRect(null);
  };

  const handleDragEnd = (event) => {
    setActiveWidgetId(null);
    setActiveWidgetRect(null);

    if (!canDrag) {
      return;
    }

    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
    const newIndex = widgets.findIndex((widget) => widget.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex).map((widget, index) => ({
      ...widget,
      position: index,
    }));

    onReorderWidgets(reorderedWidgets, widgets);
  };

  const collisionDetection = (args) => {
    const pointerHits = pointerWithin(args);

    if (pointerHits.length > 0) {
      return pointerHits;
    }

    return closestCenter(args);
  };

  const activeWidget = widgets.find((widget) => widget.id === activeWidgetId) || null;

  const gridContent = (
    <div className="grid grid-cols-2 gap-4 auto-rows-[180px] md:auto-rows-[220px]">
      {widgets.map((widget) => (
        <SortableWidget
          key={widget.id}
          widget={widget}
          canManageWidgets={canManageWidgets}
          canDrag={canDrag}
          isActiveDrag={widget.id === activeWidgetId}
          isDeleting={deletingWidgetId === widget.id}
          onDelete={onDeleteWidget}
        />
      ))}
    </div>
  );

  if (!canDrag) {
    return gridContent;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
        {gridContent}
      </SortableContext>
      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeWidget ? (
          <div
            style={activeWidgetRect ? {
              width: activeWidgetRect.width,
              height: activeWidgetRect.height,
            } : undefined}
            className={activeWidget.size === 'RECT' ? 'max-w-none' : ''}
          >
            <TestWidgetCard
              widget={activeWidget}
              canManageWidgets={false}
              canDrag={false}
              isDragging
              isDeleting={false}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
