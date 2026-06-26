const prisma = require('../lib/prisma');
const {
  SETTLEMENT_TITLE,
  buildExpenseWidgetState,
} = require('../services/tricount.service');

const parsePositiveInt = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
};

const validateWidgetAccess = async (widgetId, groupId) => {
  const widget = await prisma.widget.findFirst({
    where: { id: widgetId, groupId, type: 'TRICOUNT' },
    select: { id: true },
  });
  return widget;
};

const getGroupMemberIds = async (groupId) => {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
};

const normalizeParticipants = (rawParticipants, memberIds) => {
  if (!Array.isArray(rawParticipants) || rawParticipants.length === 0) {
    return null;
  }

  const participants = [...new Set(
    rawParticipants
      .map((id) => parsePositiveInt(id))
      .filter((id) => id && memberIds.includes(id))
  )];

  return participants.length > 0 ? participants : null;
};

const normalizeAmount = (value) => {
  const amount = parseFloat(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
};

exports.getExpenses = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);

    if (groupId === null || widgetId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    if (!await validateWidgetAccess(widgetId, groupId)) {
      return res.status(404).json({ message: 'Widget Tricount introuvable.' });
    }

    const state = await buildExpenseWidgetState(widgetId, groupId);
    res.status(200).json(state);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);

    if (groupId === null || widgetId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    if (!await validateWidgetAccess(widgetId, groupId)) {
      return res.status(404).json({ message: 'Widget Tricount introuvable.' });
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      return res.status(400).json({ message: 'Le titre de la dépense est obligatoire.' });
    }

    const amount = normalizeAmount(req.body.amount);
    if (amount === null) {
      return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
    }

    const memberIds = await getGroupMemberIds(groupId);
    const paidById = req.body.paidById !== undefined ? parsePositiveInt(req.body.paidById) : req.user.id;
    if (!paidById || !memberIds.includes(paidById)) {
      return res.status(400).json({ message: 'Le payeur doit être membre du groupe.' });
    }

    const participants = req.body.participants === undefined
      ? memberIds
      : normalizeParticipants(req.body.participants, memberIds);

    if (!participants) {
      return res.status(400).json({ message: 'Au moins un bénéficiaire valide est obligatoire.' });
    }

    await prisma.expense.create({
      data: { widgetId, groupId, title, amount, paidById, participants },
    });

    const state = await buildExpenseWidgetState(widgetId, groupId);
    res.status(201).json({ message: 'Dépense ajoutée avec succès.', ...state });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);
    const expenseId = parsePositiveInt(req.params.expenseId);

    if (groupId === null || widgetId === null || expenseId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, widgetId, groupId },
      select: { id: true, paidById: true },
    });

    if (!expense) {
      return res.status(404).json({ message: 'Dépense introuvable.' });
    }

    const isOwner = expense.paidById === req.user.id;
    const isPrivileged = ['ADMIN', 'EDITOR'].includes(req.memberRole);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres dépenses.' });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    const state = await buildExpenseWidgetState(widgetId, groupId);
    res.status(200).json({ message: 'Dépense supprimée avec succès.', ...state });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);
    const expenseId = parsePositiveInt(req.params.expenseId);

    if (groupId === null || widgetId === null || expenseId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    if (!await validateWidgetAccess(widgetId, groupId)) {
      return res.status(404).json({ message: 'Widget Tricount introuvable.' });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, widgetId, groupId },
      select: { id: true, title: true, amount: true, paidById: true, participants: true },
    });

    if (!expense) {
      return res.status(404).json({ message: 'Dépense introuvable.' });
    }

    if (expense.title === SETTLEMENT_TITLE) {
      return res.status(400).json({ message: 'Un remboursement ne peut pas être modifié.' });
    }

    const isOwner = expense.paidById === req.user.id;
    const isPrivileged = ['ADMIN', 'EDITOR'].includes(req.memberRole);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres dépenses.' });
    }

    const memberIds = await getGroupMemberIds(groupId);
    const data = {};

    if (req.body.title !== undefined) {
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
      if (!title) return res.status(400).json({ message: 'Le titre de la dépense est obligatoire.' });
      data.title = title;
    }

    if (req.body.amount !== undefined) {
      const amount = normalizeAmount(req.body.amount);
      if (amount === null) return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
      data.amount = amount;
    }

    if (req.body.paidById !== undefined) {
      const paidById = parsePositiveInt(req.body.paidById);
      if (!paidById || !memberIds.includes(paidById)) {
        return res.status(400).json({ message: 'Le payeur doit être membre du groupe.' });
      }
      data.paidById = paidById;
    }

    if (req.body.participants !== undefined) {
      const participants = normalizeParticipants(req.body.participants, memberIds);
      if (!participants) return res.status(400).json({ message: 'Aucun participant valide fourni.' });
      data.participants = participants;
    }

    await prisma.expense.update({
      where: { id: expenseId },
      data,
    });

    const state = await buildExpenseWidgetState(widgetId, groupId);
    res.status(200).json({ message: 'Dépense mise à jour avec succès.', ...state });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// Enregistre un remboursement : fromId rembourse toId du montant de la dette
// Mathématiquement : paidById=fromId, participants=[toId] → remet les soldes à zéro
exports.settleDebt = async (req, res) => {
  try {
    const groupId = parsePositiveInt(req.params.id);
    const widgetId = parsePositiveInt(req.params.widgetId);

    if (groupId === null || widgetId === null) {
      return res.status(400).json({ message: 'IDs invalides.' });
    }

    if (!await validateWidgetAccess(widgetId, groupId)) {
      return res.status(404).json({ message: 'Widget Tricount introuvable.' });
    }

    const fromId = parsePositiveInt(req.body.fromId);
    const toId = parsePositiveInt(req.body.toId);
    const amount = normalizeAmount(req.body.amount);

    if (!fromId || !toId || fromId === toId) {
      return res.status(400).json({ message: 'fromId et toId doivent être deux membres distincts.' });
    }

    if (amount === null) {
      return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
    }

    // Vérifier que fromId et toId sont membres du groupe
    const memberIds = (await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    })).map((gm) => gm.userId);

    if (!memberIds.includes(fromId) || !memberIds.includes(toId)) {
      return res.status(400).json({ message: 'Les deux personnes doivent être membres du groupe.' });
    }

    // Crée la dépense de remboursement :
    // fromId "paie" amount → toId est le seul "participant" (il en bénéficie)
    // Résultat : fromId +amount -0 = +amount, toId -amount → soldes se compensent
    await prisma.expense.create({
      data: {
        widgetId,
        groupId,
        title: SETTLEMENT_TITLE,
        amount: Math.round(amount * 100) / 100,
        paidById: fromId,
        participants: [toId],
      },
    });

    const state = await buildExpenseWidgetState(widgetId, groupId);
    res.status(201).json({ message: 'Remboursement enregistré.', ...state });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
