import { useEffect, useState } from 'react';
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
  children,
}) {
  const [activeWidgetId, setActiveWidgetId] = useState(null);
  const [activeWidgetRect, setActiveWidgetRect] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1030;
  });
  const [isMobileEditMode, setIsMobileEditMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 1029px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateViewport);
      return () => mediaQuery.removeEventListener('change', updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || !canManageWidgets || widgets.length === 0) {
      setIsMobileEditMode(false);
    }
  }, [canManageWidgets, isMobileViewport, widgets.length]);

  const canDrag = canManageWidgets && !isReordering && (!isMobileViewport || isMobileEditMode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: isMobileViewport ? 4 : 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: isMobileViewport && isMobileEditMode
        ? { delay: 0, tolerance: 8 }
        : { delay: 180, tolerance: 6 },
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
      setActiveWidgetRect({ width: initialRect.width, height: initialRect.height });
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

    if (!canDrag) return;

    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
    const newIndex = widgets.findIndex((widget) => widget.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex).map((widget, index) => ({
      ...widget,
      position: index,
    }));

    onReorderWidgets(reorderedWidgets, widgets);
  };

  const handleEnterMobileEditMode = () => {
    if (!isMobileViewport || !canManageWidgets || isReordering) return;
    setIsMobileEditMode(true);
  };

  const handleGridPointerDown = (event) => {
    if (!isMobileViewport || !isMobileEditMode) return;
    if (event.target === event.currentTarget) {
      setIsMobileEditMode(false);
    }
  };

  const collisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return closestCenter(args);
  };

  const activeWidget = widgets.find((widget) => widget.id === activeWidgetId) || null;

  const gridContent = (
    <div
      className={`grid grid-cols-2 gap-8 w-full ${isMobileViewport && isMobileEditMode ? 'select-none' : ''}`}
      onPointerDown={handleGridPointerDown}
    >
      {widgets.map((widget) => (
        <SortableWidget
          key={widget.id}
          widget={widget}
          canManageWidgets={canManageWidgets}
          canDrag={canDrag}
          isActiveDrag={widget.id === activeWidgetId}
          isDeleting={deletingWidgetId === widget.id}
          isMobileViewport={isMobileViewport}
          isMobileEditMode={isMobileEditMode}
          onEnterMobileEditMode={handleEnterMobileEditMode}
          onDelete={onDeleteWidget}
        />
      ))}
      {children}
    </div>
  );

  if (!canDrag) return gridContent;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
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
            style={activeWidgetRect ? { width: activeWidgetRect.width, height: activeWidgetRect.height } : undefined}
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

