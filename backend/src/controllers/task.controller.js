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

const getWidgetWithGroupAccess = async (widgetId, userId) => {
  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    select: { id: true, groupId: true, type: true },
  });

  if (!widget) return { error: 'Widget introuvable.', status: 404 };

  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: widget.groupId } },
  });

  if (!member) return { error: 'Accès refusé.', status: 403 };

  return { widget, member };
};

exports.getTasksByWidget = async (req, res) => {
  try {
    const widgetId = parsePositiveInt(req.params.widgetId);
    if (widgetId === null) return res.status(400).json({ message: 'ID de widget invalide.' });

    const { error, status } = await getWidgetWithGroupAccess(widgetId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    const tasks = await prisma.task.findMany({
      where: { widgetId },
      orderBy: { createdAt: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(200).json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const widgetId = parsePositiveInt(req.params.widgetId);
    if (widgetId === null) return res.status(400).json({ message: 'ID de widget invalide.' });

    const { widget, member, error, status } = await getWidgetWithGroupAccess(widgetId, req.user.id);
    if (error) return res.status(status).json({ message: error });

    if (!['ADMIN', 'EDITOR'].includes(member.role)) {
      return res.status(403).json({ message: 'Vous devez être ADMIN ou EDITOR pour créer une tâche.' });
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ message: 'Le titre de la tâche est obligatoire.' });

    const assignedToId = req.body.assignedToId !== undefined
      ? parsePositiveInt(req.body.assignedToId)
      : null;

    if (assignedToId !== null) {
      const assigneeMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: assignedToId, groupId: widget.groupId } },
      });
      if (!assigneeMember) {
        return res.status(400).json({ message: 'La personne assignée doit être membre du groupe.' });
      }
    }

    const task = await prisma.task.create({
      data: { widgetId, title, assignedToId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ message: 'Tâche créée avec succès.', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = parsePositiveInt(req.params.taskId);
    if (taskId === null) return res.status(400).json({ message: 'ID de tâche invalide.' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { widget: { select: { groupId: true } } },
    });

    if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: task.widget.groupId } },
    });

    if (!member) return res.status(403).json({ message: 'Accès refusé.' });

    const isCompleted = typeof req.body.isCompleted === 'boolean'
      ? req.body.isCompleted
      : task.isCompleted;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(200).json({ message: 'Tâche mise à jour.', task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = parsePositiveInt(req.params.taskId);
    if (taskId === null) return res.status(400).json({ message: 'ID de tâche invalide.' });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { widget: { select: { groupId: true } } },
    });

    if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: task.widget.groupId } },
    });

    if (!member) return res.status(403).json({ message: 'Accès refusé.' });

    if (!['ADMIN', 'EDITOR'].includes(member.role)) {
      return res.status(403).json({ message: 'Vous devez être ADMIN ou EDITOR pour supprimer une tâche.' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.status(200).json({ message: 'Tâche supprimée avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
