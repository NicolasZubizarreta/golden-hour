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

// Algorithme de simplification des dettes (méthode "greedy")
const computeDebts = (expenses, members) => {
  const balances = {};
  members.forEach((m) => { balances[m.id] = 0; });

  expenses.forEach((expense) => {
    const participants = Array.isArray(expense.participants) ? expense.participants : [];
    if (participants.length === 0) return;

    const share = expense.amount / participants.length;

    // Le payeur avance l'argent : il est crédité du montant total
    balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount;

    // Chaque participant doit sa part
    participants.forEach((participantId) => {
      balances[participantId] = (balances[participantId] || 0) - share;
    });
  });

  // Construire les maps id -> name/avatar pour enrichir les transactions
  const userMap = {};
  members.forEach((m) => { userMap[m.id] = m; });

  // Simplifier les dettes avec l'algorithme greedy
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.005)
    .map(([id, b]) => ({ id: parseInt(id, 10), balance: b }))
    .sort((a, b) => a.balance - b.balance); // Plus endetté en premier

  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.005)
    .map(([id, b]) => ({ id: parseInt(id, 10), balance: b }))
    .sort((a, b) => b.balance - a.balance); // Plus créditeur en premier

  const transactions = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(-debtor.balance, creditor.balance);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      transactions.push({
        fromId: debtor.id,
        fromName: userMap[debtor.id]?.name || 'Inconnu',
        toId: creditor.id,
        toName: userMap[creditor.id]?.name || 'Inconnu',
        amount: rounded,
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.005) d += 1;
    if (Math.abs(creditor.balance) < 0.005) c += 1;
  }

  // Arrondir les balances finales
  const roundedBalances = {};
  Object.entries(balances).forEach(([id, b]) => {
    roundedBalances[id] = Math.round(b * 100) / 100;
  });

  return { balances: roundedBalances, transactions };
};

// Titre interne utilisé pour distinguer les remboursements des dépenses
const SETTLEMENT_TITLE = '__remboursement__';

// Helper : récupère + enrichit toutes les dépenses d'un widget et calcule les dettes
const buildWidgetState = async (widgetId, groupId) => {
  const [allExpenses, allMembers] = await Promise.all([
    prisma.expense.findMany({
      where: { widgetId },
      orderBy: { createdAt: 'desc' },
      include: { paidBy: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    }),
  ]);

  const members = allMembers.map((gm) => ({
    id: gm.user.id,
    name: gm.user.name,
    avatar: gm.user.avatar,
    role: gm.role,
  }));

  const userMap = {};
  members.forEach((m) => { userMap[m.id] = m; });

  const enrichedExpenses = allExpenses.map((e) => {
    const parts = Array.isArray(e.participants) ? e.participants : [];
    return {
      id: e.id,
      title: e.title === SETTLEMENT_TITLE ? 'Remboursement' : e.title,
      isSettlement: e.title === SETTLEMENT_TITLE,
      amount: e.amount,
      paidBy: e.paidBy,
      participants: parts.map((uid) => userMap[uid] || { id: uid, name: 'Inconnu', avatar: null }),
      createdAt: e.createdAt,
    };
  });

  const { balances, transactions } = computeDebts(allExpenses, members);

  return { expenses: enrichedExpenses, members, balances, debts: transactions };
};

const validateWidgetAccess = async (widgetId, groupId) => {
  const widget = await prisma.widget.findFirst({
    where: { id: widgetId, groupId, type: 'TRICOUNT' },
    select: { id: true },
  });
  return widget;
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

    const state = await buildWidgetState(widgetId, groupId);
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

    const amount = parseFloat(req.body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
    }

    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const memberIds = groupMembers.map((gm) => gm.userId);

    let participants;
    if (Array.isArray(req.body.participants) && req.body.participants.length > 0) {
      const valid = req.body.participants.map((id) => parsePositiveInt(id)).filter((id) => id && memberIds.includes(id));
      if (valid.length === 0) return res.status(400).json({ message: 'Aucun participant valide fourni.' });
      participants = valid;
    } else {
      participants = memberIds;
    }

    await prisma.expense.create({
      data: { widgetId, groupId, title, amount, paidById: req.user.id, participants },
    });

    const state = await buildWidgetState(widgetId, groupId);
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

    const state = await buildWidgetState(widgetId, groupId);
    res.status(200).json({ message: 'Dépense supprimée avec succès.', ...state });
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
    const amount = parseFloat(req.body.amount);

    if (!fromId || !toId || fromId === toId) {
      return res.status(400).json({ message: 'fromId et toId doivent être deux membres distincts.' });
    }

    if (Number.isNaN(amount) || amount <= 0) {
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

    const state = await buildWidgetState(widgetId, groupId);
    res.status(201).json({ message: 'Remboursement enregistré.', ...state });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
