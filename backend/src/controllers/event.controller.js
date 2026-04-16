const prisma = require('../lib/prisma');

const parsePositiveInt = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
};

const parseIsoDate = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getWidgetWithGroupAccess = async (widgetId, userId) => {
  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    select: { id: true, groupId: true, type: true },
  });

  if (!widget) return { error: 'Widget introuvable.', status: 404 };

  if (widget.type !== 'CALENDAR') {
    return { error: 'Ce widget ne peut pas contenir d’événements.', status: 400 };
  }

  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: widget.groupId } },
  });

  if (!member) return { error: 'Accès refusé.', status: 403 };

  return { widget, member };
};

exports.getEventsByWidget = async (req, res) => {
  try {
    const widgetId = parsePositiveInt(req.params.widgetId);
    if (widgetId === null) return res.status(400).json({ message: 'ID de widget invalide.' });

    const { error, status } = await getWidgetWithGroupAccess(widgetId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    const events = await prisma.event.findMany({
      where: { widgetId },
      orderBy: { startDate: 'asc' },
    });

    res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const widgetId = parsePositiveInt(req.params.widgetId);
    if (widgetId === null) return res.status(400).json({ message: 'ID de widget invalide.' });

    const { member, error, status } = await getWidgetWithGroupAccess(widgetId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    if (!['ADMIN', 'EDITOR'].includes(member.role)) {
      return res.status(403).json({ message: 'Vous devez être ADMIN ou EDITOR pour créer un événement.' });
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ message: "Le titre de l'événement est obligatoire." });

    const startDate = parseIsoDate(req.body.startDate);
    if (!startDate) return res.status(400).json({ message: "La date de début est obligatoire et doit être valide." });

    const endDate = req.body.endDate != null ? parseIsoDate(req.body.endDate) : null;
    if (req.body.endDate != null && !endDate) {
      return res.status(400).json({ message: "La date de fin est invalide." });
    }

    if (endDate && endDate <= startDate) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    const event = await prisma.event.create({
      data: { widgetId, title, startDate, endDate },
    });

    res.status(201).json({ message: 'Événement créé avec succès.', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = parsePositiveInt(req.params.eventId);
    if (eventId === null) return res.status(400).json({ message: "ID d'événement invalide." });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { widget: { select: { groupId: true, type: true } } },
    });

    if (!event) return res.status(404).json({ message: 'Événement introuvable.' });

    if (event.widget.type !== 'CALENDAR') {
      return res.status(400).json({ message: 'Ce widget ne peut pas contenir d’événements.' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: event.widget.groupId } },
    });

    if (!member) return res.status(403).json({ message: 'Accès refusé.' });

    if (!['ADMIN', 'EDITOR'].includes(member.role)) {
      return res.status(403).json({ message: "Vous devez être ADMIN ou EDITOR pour modifier un événement." });
    }

    let title = event.title;
    if (req.body.title !== undefined) {
      title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
      if (!title) return res.status(400).json({ message: "Le titre de l'événement est obligatoire." });
    }

    let startDate = event.startDate;
    if (req.body.startDate !== undefined) {
      startDate = parseIsoDate(req.body.startDate);
      if (!startDate) return res.status(400).json({ message: 'La date de début est invalide.' });
    }

    let endDate = event.endDate;
    if (req.body.endDate === null) {
      endDate = null;
    } else if (req.body.endDate !== undefined) {
      endDate = parseIsoDate(req.body.endDate);
      if (!endDate) return res.status(400).json({ message: 'La date de fin est invalide.' });
    }

    if (endDate && endDate <= startDate) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début.' });
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { title, startDate, endDate },
    });

    res.status(200).json({ message: 'Événement mis à jour.', event: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const eventId = parsePositiveInt(req.params.eventId);
    if (eventId === null) return res.status(400).json({ message: "ID d'événement invalide." });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { widget: { select: { groupId: true, type: true } } },
    });

    if (!event) return res.status(404).json({ message: 'Événement introuvable.' });

    if (event.widget.type !== 'CALENDAR') {
      return res.status(400).json({ message: 'Ce widget ne peut pas contenir d’événements.' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: event.widget.groupId } },
    });

    if (!member) return res.status(403).json({ message: 'Accès refusé.' });

    if (!['ADMIN', 'EDITOR'].includes(member.role)) {
      return res.status(403).json({ message: "Vous devez être ADMIN ou EDITOR pour supprimer un événement." });
    }

    await prisma.event.delete({ where: { id: eventId } });

    res.status(200).json({ message: 'Événement supprimé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
