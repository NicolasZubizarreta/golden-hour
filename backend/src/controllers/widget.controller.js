const prisma = require('../lib/prisma');
const {
  WIDGET_TYPES,
  WIDGET_SIZES,
  normalizeWidgetDataForPersist,
} = require('../widgets/widgetRegistry');

const parsePositiveInt = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
};

const parseNonNegativeInt = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
};

const normalizeEnumValue = (value, allowedValues) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();
  return allowedValues.includes(normalizedValue) ? normalizedValue : null;
};

const getSortedWidgetsForGroup = (groupId) => prisma.widget.findMany({
  where: { groupId },
  orderBy: [{ position: 'asc' }, { id: 'asc' }],
});

exports.getWidgets = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);

    if (groupId === null) {
      return res.status(400).json({ message: 'ID du groupe invalide.' });
    }

    const widgets = await getSortedWidgetsForGroup(groupId);
    res.status(200).json({ widgets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.addWidget = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);

    if (groupId === null) {
      return res.status(400).json({ message: 'ID du groupe invalide.' });
    }

    const normalizedType = req.body.type === undefined
      ? 'TEST'
      : normalizeEnumValue(req.body.type, WIDGET_TYPES);
    const normalizedSize = req.body.size === undefined
      ? 'SQUARE'
      : normalizeEnumValue(req.body.size, WIDGET_SIZES);

    if (!normalizedType) {
      return res.status(400).json({ message: `Le type du widget doit etre parmi: ${WIDGET_TYPES.join(', ')}.` });
    }

    if (!normalizedSize) {
      return res.status(400).json({ message: `La taille du widget doit etre SQUARE ou RECT.` });
    }

    if (req.body.data !== undefined && (req.body.data === null || typeof req.body.data !== 'object' || Array.isArray(req.body.data))) {
      return res.status(400).json({ message: 'Le champ data doit etre un objet JSON.' });
    }

    const widgetsCount = await prisma.widget.count({ where: { groupId } });
    const normalizedWidgetData = await normalizeWidgetDataForPersist({
      type: normalizedType,
      size: normalizedSize,
      rawData: req.body.data,
      position: widgetsCount,
    });

    if (normalizedWidgetData.error) {
      return res.status(400).json({ message: normalizedWidgetData.error });
    }

    const widget = await prisma.widget.create({
      data: {
        groupId,
        type: normalizedType,
        size: normalizedSize,
        position: widgetsCount,
        data: normalizedWidgetData.data,
      },
    });

    const widgets = await getSortedWidgetsForGroup(groupId);

    res.status(201).json({
      message: 'Widget ajoute avec succes.',
      widget,
      widgets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.deleteWidget = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);

    if (groupId === null || widgetId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    const widget = await prisma.widget.findFirst({
      where: { id: widgetId, groupId },
      select: { id: true, position: true },
    });

    if (!widget) {
      return res.status(404).json({ message: 'Widget introuvable.' });
    }

    await prisma.$transaction([
      prisma.widget.delete({ where: { id: widgetId } }),
      prisma.widget.updateMany({
        where: {
          groupId,
          position: { gt: widget.position },
        },
        data: {
          position: { decrement: 1 },
        },
      }),
    ]);

    const widgets = await getSortedWidgetsForGroup(groupId);

    res.status(200).json({
      message: 'Widget supprime avec succes.',
      widgets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.updateWidget = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);

    if (groupId === null || widgetId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    const existingWidget = await prisma.widget.findFirst({
      where: { id: widgetId, groupId },
      select: { id: true, type: true, size: true, data: true },
    });

    if (!existingWidget) {
      return res.status(404).json({ message: 'Widget introuvable.' });
    }

    const normalizedType = req.body.type === undefined
      ? existingWidget.type
      : normalizeEnumValue(req.body.type, WIDGET_TYPES);
    const normalizedSize = req.body.size === undefined
      ? existingWidget.size
      : normalizeEnumValue(req.body.size, WIDGET_SIZES);

    if (!normalizedType) {
      return res.status(400).json({ message: `Le type du widget doit etre parmi: ${WIDGET_TYPES.join(', ')}.` });
    }

    if (!normalizedSize) {
      return res.status(400).json({ message: 'La taille du widget doit etre SQUARE ou RECT.' });
    }

    if (req.body.data !== undefined && (req.body.data === null || typeof req.body.data !== 'object' || Array.isArray(req.body.data))) {
      return res.status(400).json({ message: 'Le champ data doit etre un objet JSON.' });
    }

    let widgetData = req.body.data === undefined ? existingWidget.data : req.body.data;
    const normalizedWidgetData = await normalizeWidgetDataForPersist({
      type: normalizedType,
      size: normalizedSize,
      rawData: widgetData,
    });

    if (normalizedWidgetData.error) {
      return res.status(400).json({ message: normalizedWidgetData.error });
    }

    const widget = await prisma.widget.update({
      where: { id: widgetId },
      data: {
        type: normalizedType,
        size: normalizedSize,
        data: normalizedWidgetData.data,
      },
    });

    const widgets = await getSortedWidgetsForGroup(groupId);

    res.status(200).json({
      message: 'Widget mis a jour avec succes.',
      widget,
      widgets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.reorderWidgets = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);

    if (groupId === null) {
      return res.status(400).json({ message: 'ID du groupe invalide.' });
    }

    const widgetUpdates = req.body.widgets;

    if (!Array.isArray(widgetUpdates)) {
      return res.status(400).json({ message: 'Le body doit contenir un tableau widgets.' });
    }

    const existingWidgets = await prisma.widget.findMany({
      where: { groupId },
      select: { id: true },
    });

    if (existingWidgets.length === 0 && widgetUpdates.length === 0) {
      return res.status(200).json({ message: 'Aucun widget a reordonner.', widgets: [] });
    }

    const normalizedUpdates = widgetUpdates.map((widget) => ({
      id: parsePositiveInt(widget?.id),
      position: parseNonNegativeInt(widget?.position),
    }));

    if (normalizedUpdates.some((widget) => widget.id === null || widget.position === null)) {
      return res.status(400).json({ message: 'Chaque widget doit contenir un id et une position valides.' });
    }

    const ids = normalizedUpdates.map((widget) => widget.id);
    const positions = normalizedUpdates.map((widget) => widget.position);
    const uniqueIds = new Set(ids);
    const uniquePositions = new Set(positions);
    const existingIds = new Set(existingWidgets.map((widget) => widget.id));
    const expectedPositions = Array.from({ length: normalizedUpdates.length }, (_, index) => index);
    const sortedPositions = [...uniquePositions].sort((a, b) => a - b);

    if (uniqueIds.size !== ids.length) {
      return res.status(400).json({ message: 'Le tableau contient des widgets en doublon.' });
    }

    if (uniquePositions.size !== positions.length) {
      return res.status(400).json({ message: 'Chaque position doit etre unique.' });
    }

    if (existingWidgets.length !== normalizedUpdates.length || ids.some((id) => !existingIds.has(id))) {
      return res.status(400).json({ message: 'Le tableau de reorder doit contenir tous les widgets du groupe.' });
    }

    if (sortedPositions.some((position, index) => position !== expectedPositions[index])) {
      return res.status(400).json({ message: 'Les positions doivent etre continues et commencer a 0.' });
    }

    await prisma.$transaction(
      normalizedUpdates.map((widget) => prisma.widget.update({
        where: { id: widget.id },
        data: { position: widget.position },
      }))
    );

    const widgets = await getSortedWidgetsForGroup(groupId);

    res.status(200).json({
      message: 'Ordre des widgets sauvegarde avec succes.',
      widgets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
