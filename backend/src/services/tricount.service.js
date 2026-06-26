const prisma = require('../lib/prisma');

const SETTLEMENT_TITLE = '__remboursement__';

const computeDebts = (expenses, members) => {
  const balances = {};
  members.forEach((member) => { balances[member.id] = 0; });

  expenses.forEach((expense) => {
    const participants = Array.isArray(expense.participants) ? expense.participants : [];
    if (participants.length === 0) return;

    const share = expense.amount / participants.length;
    balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount;

    participants.forEach((participantId) => {
      balances[participantId] = (balances[participantId] || 0) - share;
    });
  });

  const userMap = {};
  members.forEach((member) => { userMap[member.id] = member; });

  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.005)
    .map(([id, balance]) => ({ id: parseInt(id, 10), balance }))
    .sort((a, b) => a.balance - b.balance);

  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.005)
    .map(([id, balance]) => ({ id: parseInt(id, 10), balance }))
    .sort((a, b) => b.balance - a.balance);

  const transactions = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(-debtor.balance, creditor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        fromId: debtor.id,
        fromName: userMap[debtor.id]?.name || 'Inconnu',
        toId: creditor.id,
        toName: userMap[creditor.id]?.name || 'Inconnu',
        amount: roundedAmount,
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.005) debtorIndex += 1;
    if (Math.abs(creditor.balance) < 0.005) creditorIndex += 1;
  }

  const roundedBalances = {};
  Object.entries(balances).forEach(([id, balance]) => {
    roundedBalances[id] = Math.round(balance * 100) / 100;
  });

  return { balances: roundedBalances, transactions };
};

const buildExpenseWidgetState = async (widgetId, groupId) => {
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

  const members = allMembers.map((groupMember) => ({
    id: groupMember.user.id,
    name: groupMember.user.name,
    avatar: groupMember.user.avatar,
    role: groupMember.role,
  }));

  const userMap = {};
  members.forEach((member) => { userMap[member.id] = member; });

  const expenses = allExpenses.map((expense) => {
    const participants = Array.isArray(expense.participants) ? expense.participants : [];

    return {
      id: expense.id,
      title: expense.title === SETTLEMENT_TITLE ? 'Remboursement' : expense.title,
      isSettlement: expense.title === SETTLEMENT_TITLE,
      amount: expense.amount,
      paidBy: expense.paidBy,
      participants: participants.map((userId) => userMap[userId] || { id: userId, name: 'Inconnu', avatar: null }),
      createdAt: expense.createdAt,
    };
  });

  const { balances, transactions } = computeDebts(allExpenses, members);

  return { expenses, members, balances, debts: transactions };
};

module.exports = {
  SETTLEMENT_TITLE,
  buildExpenseWidgetState,
  computeDebts,
};
