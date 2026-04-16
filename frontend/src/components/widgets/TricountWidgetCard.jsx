import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api, { getApiErrorMessage } from '../../api/axiosConfig';
import useAuthStore from '../../store/authStore';
import { getInitials, getMediaUrl } from '../../utils/media';
import { formatAmount, getCurrencySymbol } from '../../utils/tricount';
import WidgetCardShell from './WidgetCardShell';

function Avatar({ name, avatar }) {
  const mediaUrl = getMediaUrl(avatar);

  if (mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={name || 'Avatar'}
        className="h-6 w-6 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-black text-amber-800">
      {getInitials(name)}
    </span>
  );
}

const getDefaultPaidById = (members, currentUser) => {
  if (currentUser?.id && members.some((member) => member.id === currentUser.id)) {
    return currentUser.id;
  }

  return members[0]?.id || '';
};

const createExpenseDraft = (members, currentUser, initialDraft = null) => {
  if (initialDraft) {
    return {
      title: initialDraft.title || '',
      amount: String(initialDraft.amount ?? ''),
      paidById: initialDraft.paidById || getDefaultPaidById(members, currentUser),
      participants: Array.isArray(initialDraft.participants)
        ? [...initialDraft.participants]
        : members.map((member) => member.id),
    };
  }

  return {
    title: '',
    amount: '',
    paidById: getDefaultPaidById(members, currentUser),
    participants: members.map((member) => member.id),
  };
};

const getMemberNameList = (members = []) => {
  if (members.length === 0) return 'personne';
  if (members.length <= 3) return members.map((member) => member.name).join(', ');
  return `${members.slice(0, 2).map((member) => member.name).join(', ')} +${members.length - 2}`;
};

function ExpenseModal({
  members,
  currency,
  currentUser,
  initialDraft,
  isEditing,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) {
  const [draft, setDraft] = useState(() => createExpenseDraft(members, currentUser, initialDraft));

  const amount = Number.parseFloat(draft.amount) || 0;
  const participantCount = draft.participants.length;
  const sharePerPerson = participantCount > 0 ? amount / participantCount : 0;
  const paidBy = members.find((member) => member.id === Number(draft.paidById));
  const selectedParticipants = members.filter((member) => draft.participants.includes(member.id));
  const debtors = members.filter((member) => (
    member.id !== Number(draft.paidById) && draft.participants.includes(member.id)
  ));
  const isPaidByOnlyParticipant = participantCount === 1 && draft.participants.includes(Number(draft.paidById));

  const toggleParticipant = (id) => {
    setDraft((previous) => ({
      ...previous,
      participants: previous.participants.includes(id)
        ? previous.participants.filter((participantId) => participantId !== id)
        : [...previous.participants, id],
    }));
  };

  const selectAllParticipants = () => {
    setDraft((previous) => ({
      ...previous,
      participants: members.map((member) => member.id),
    }));
  };

  const clearParticipants = () => {
    setDraft((previous) => ({
      ...previous,
      participants: [],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...draft,
      paidById: Number(draft.paidById),
      amount: Number.parseFloat(draft.amount),
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-golden bg-white p-6 shadow-halo">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-black text-gray-900">
            {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-golden p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            aria-label="Fermer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-golden bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-halo">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700">Description</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Restaurant, hôtel, courses..."
              className="rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-gray-900 shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700">Montant payé ({getCurrencySymbol(currency)})</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={draft.amount}
              onChange={(event) => setDraft((previous) => ({ ...previous, amount: event.target.value }))}
              placeholder="0,00"
              className="rounded-golden bg-golden-input px-5 py-3 text-sm font-medium text-gray-900 shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-gray-700">Qui a payé ?</span>
            <select
              value={draft.paidById}
              onChange={(event) => setDraft((previous) => ({ ...previous, paidById: Number(event.target.value) }))}
              className="rounded-golden bg-golden-input px-5 py-3 pr-10 text-sm font-bold text-gray-900 shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}{member.id === currentUser?.id ? ' (vous)' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-gray-700">Pour qui ?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllParticipants}
                  className="rounded-golden bg-amber-100 px-3 py-1.5 text-[11px] font-black text-amber-800 shadow-halo transition hover:bg-amber-200 cursor-pointer"
                >
                  Tout le groupe
                </button>
                <button
                  type="button"
                  onClick={clearParticipants}
                  className="rounded-golden bg-white px-3 py-1.5 text-[11px] font-black text-gray-500 shadow-halo transition hover:text-gray-900 cursor-pointer"
                >
                  Vider
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {members.map((member) => {
                const active = draft.participants.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleParticipant(member.id)}
                    className={`flex items-center justify-between rounded-golden px-4 py-3 text-sm font-semibold transition cursor-pointer shadow-halo ${
                      active
                        ? 'bg-amber-50 text-gray-900 ring-2 ring-amber-300'
                        : 'bg-white text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={member.name} avatar={member.avatar} />
                      <span className="truncate">
                        {member.name}{member.id === currentUser?.id ? ' (vous)' : ''}
                      </span>
                    </div>
                    {active && amount > 0 && (
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="text-sm font-black text-amber-700">{formatAmount(sharePerPerson, currency)}</span>
                        <span className="text-[10px] font-bold text-gray-400">sa part</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {amount > 0 && paidBy && participantCount > 0 && (
            <div className="rounded-golden bg-golden-input px-5 py-4 shadow-creuse">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Résultat
              </p>
              <p className="mb-3 text-xs font-semibold leading-snug text-gray-500">
                {paidBy.name} paie {formatAmount(amount, currency)} pour {getMemberNameList(selectedParticipants)}.
              </p>
              {isPaidByOnlyParticipant && (
                <p className="text-xs font-bold leading-snug text-amber-700">
                  Le payeur est le seul bénéficiaire : cette dépense ne créera aucune dette.
                </p>
              )}
              {debtors.map((debtor) => (
                <div key={debtor.id} className="flex items-center justify-between gap-3 py-0.5">
                  <span className="min-w-0 truncate text-sm font-semibold text-gray-700">{debtor.name} doit à {paidBy.name}</span>
                  <span className="shrink-0 text-sm font-black text-red-500">{formatAmount(sharePerPerson, currency)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !draft.title.trim() || amount <= 0 || !draft.paidById || draft.participants.length === 0}
            className="rounded-golden bg-golden-primary px-5 py-4 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? (isEditing ? 'Modification...' : 'Enregistrement...')
              : (isEditing ? 'Modifier la dépense' : 'Ajouter la dépense')}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function TricountWidgetCard(props) {
  const { widget, canManageWidgets = false } = props;
  const currency = widget.data?.currency || 'EUR';
  const title = widget.data?.title || 'Tricount';
  const groupId = widget.groupId;
  const widgetId = widget.id;
  const currentUser = useAuthStore((state) => state.user);

  const [state, setState] = useState({ expenses: [], members: [], balances: {}, debts: [], loaded: false });
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settlingKey, setSettlingKey] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!groupId || !widgetId || String(widgetId).startsWith('preview-')) {
      setState((previous) => ({ ...previous, loaded: true }));
      return;
    }

    try {
      const { data } = await api.get(`/groups/${groupId}/widgets/${widgetId}/expenses`);
      if (isMounted.current) setState({ ...data, loaded: true });
    } catch {
      if (isMounted.current) setState((previous) => ({ ...previous, loaded: true }));
    }
  }, [groupId, widgetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const realExpenses = useMemo(
    () => state.expenses.filter((expense) => !expense.isSettlement),
    [state.expenses]
  );

  const totalAmount = useMemo(
    () => realExpenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0),
    [realExpenses]
  );
  const settlementExpenses = useMemo(
    () => state.expenses.filter((expense) => expense.isSettlement),
    [state.expenses]
  );
  const canOpenExpenseModal = Boolean(groupId && widgetId && state.members.length > 0);

  const openCreateModal = () => {
    setEditingExpense(null);
    setSubmitError(null);
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      paidById: expense.paidBy?.id || getDefaultPaidById(state.members, currentUser),
      participants: expense.participants.map((participant) => participant.id),
    });
    setSubmitError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setSubmitError(null);
  };

  const handleSubmitExpense = async (draft) => {
    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      title: draft.title,
      amount: draft.amount,
      paidById: draft.paidById,
      participants: draft.participants,
    };

    try {
      const request = editingExpense
        ? api.patch(`/groups/${groupId}/widgets/${widgetId}/expenses/${editingExpense.id}`, payload)
        : api.post(`/groups/${groupId}/widgets/${widgetId}/expenses`, payload);
      const { data } = await request;

      if (isMounted.current) {
        setState({ ...data, loaded: true });
        closeModal();
      }
    } catch (error) {
      if (isMounted.current) setSubmitError(getApiErrorMessage(error));
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    setDeletingId(id);
    try {
      const { data } = await api.delete(`/groups/${groupId}/widgets/${widgetId}/expenses/${id}`);
      if (isMounted.current) setState({ ...data, loaded: true });
    } catch {
      // Deletion errors are non-blocking in the card UI.
    } finally {
      if (isMounted.current) setDeletingId(null);
    }
  };

  const handleSettle = async (fromId, toId, amount) => {
    const key = `${fromId}-${toId}`;
    setSettlingKey(key);
    try {
      const { data } = await api.post(`/groups/${groupId}/widgets/${widgetId}/expenses/settle`, { fromId, toId, amount });
      if (isMounted.current) setState({ ...data, loaded: true });
    } catch {
      // Settlement errors are non-blocking in the card UI.
    } finally {
      if (isMounted.current) setSettlingKey(null);
    }
  };

  const modal = showModal ? (
    <ExpenseModal
      members={state.members}
      currency={currency}
      currentUser={currentUser}
      initialDraft={editingExpense}
      isEditing={Boolean(editingExpense)}
      onClose={closeModal}
      onSubmit={handleSubmitExpense}
      isSubmitting={isSubmitting}
      error={submitError}
    />
  ) : null;

  if (widget.size !== 'RECT') {
    return (
      <WidgetCardShell
        {...props}
        typeLabel="Tricount"
        style={{
          background: 'linear-gradient(135deg,#92400e 0%,#d97706 55%,#78350f 100%)',
          color: '#FFF7ED',
        }}
        controlsTone="light"
      >
        {modal}
        <div className="flex h-full items-center justify-center text-center">
          <p className="max-w-[14rem] text-sm font-black leading-snug text-amber-50">
            Tricount est disponible uniquement en format rectangle.
          </p>
        </div>
      </WidgetCardShell>
    );
  }

  return (
    <WidgetCardShell
      {...props}
      typeLabel="Tricount"
      showTypeLabel={false}
      className="[container-type:inline-size]"
      style={{ backgroundColor: '#fffbeb' }}
      controlsTone="dark"
    >
      {modal}

      <div className="flex h-full min-h-0 gap-[clamp(0.75rem,4cqw,1.25rem)] overflow-hidden">
        <div className="flex min-h-0 w-[44%] shrink-0 flex-col">
          <div className="mb-[clamp(0.4rem,2cqw,0.75rem)] flex flex-col items-start gap-[clamp(0.35rem,1.6cqw,0.6rem)]">
            <div className="min-w-0">
              <p className="text-[clamp(0.52rem,1.5cqw,0.63rem)] font-bold uppercase tracking-[0.2em] text-amber-700/60">Tricount</p>
              <p className="truncate text-[clamp(0.9rem,3.2cqw,1rem)] font-black leading-tight text-gray-900">{title}</p>
              <p className="mt-0.5 text-[clamp(0.72rem,2.2cqw,0.8rem)] font-black text-amber-700">
                Total {formatAmount(totalAmount, currency)}
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              onPointerDown={(event) => event.stopPropagation()}
              disabled={!canOpenExpenseModal}
              className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-golden bg-golden-primary px-3 py-1.5 text-[clamp(0.68rem,2cqw,0.75rem)] font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span className="truncate">Ajouter</span>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 py-2">
            {!state.loaded && <p className="text-xs font-medium text-gray-400">Chargement...</p>}
            {state.loaded && realExpenses.length === 0 && (
              <p className="text-[clamp(0.72rem,2.4cqw,0.8rem)] font-medium leading-snug text-gray-400">Ajoutez la première dépense.</p>
            )}

            {state.loaded && state.debts.length === 0 && realExpenses.length > 0 && (
              <div className="flex items-center gap-3 rounded-golden bg-emerald-50 px-4 py-3 shadow-halo">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-golden bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-emerald-800">Tout est réglé</p>
                  <p className="text-[11px] font-medium text-emerald-600">
                    Aucune dette restante sur {realExpenses.length} dépense{realExpenses.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {state.loaded && state.debts.map((debt) => {
              const key = `${debt.fromId}-${debt.toId}`;
              const isSettling = settlingKey === key;

              return (
                <div key={key} className="overflow-hidden rounded-golden bg-white shadow-halo">
                  <div className="px-4 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">À régler</p>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar name={debt.fromName} />
                          <span className="truncate text-sm font-black text-gray-900">{debt.fromName}</span>
                        </div>
                        <p className="mt-1 truncate pl-8 text-xs font-semibold text-gray-500">
                          doit à {debt.toName}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-base font-black text-red-500">{formatAmount(debt.amount, currency)}</span>
                        <button
                          type="button"
                          disabled={isSettling}
                          onClick={() => handleSettle(debt.fromId, debt.toId, debt.amount)}
                          onPointerDown={(event) => event.stopPropagation()}
                          className="rounded-golden bg-emerald-100 px-3 py-1.5 text-[11px] font-black text-emerald-800 shadow-halo transition hover:bg-emerald-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSettling ? '...' : 'Régler'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {state.loaded && settlementExpenses.length > 0 && (
              <div className="rounded-golden bg-white/70 px-4 py-3 shadow-halo">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Règlements ({settlementExpenses.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {settlementExpenses.slice(0, 4).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate font-semibold text-gray-500">
                        {expense.paidBy?.name} a réglé {getMemberNameList(expense.participants)}
                      </span>
                      <span className="shrink-0 font-black text-emerald-700">{formatAmount(expense.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.loaded && state.members.length > 0 && (
              <div className="mt-1 rounded-golden bg-golden-input px-4 py-3 shadow-creuse">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Soldes</p>
                <div className="flex flex-col gap-2">
                  {state.members.map((member) => {
                    const balance = state.balances[member.id] ?? 0;
                    const isPositive = balance > 0.005;
                    const isNegative = balance < -0.005;

                    return (
                      <div key={member.id} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar name={member.name} avatar={member.avatar} />
                          <span className="truncate text-xs font-semibold text-gray-700">{member.name}</span>
                        </div>
                        <span className={`shrink-0 text-xs font-black ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                          {isPositive ? '+' : ''}{formatAmount(balance, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-px shrink-0 self-stretch bg-gray-200" />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-1 flex shrink-0 items-end justify-between gap-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Dépenses ({realExpenses.length})
            </p>
            <p className="text-[11px] font-black text-gray-500">{formatAmount(totalAmount, currency)}</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 py-2">
            {realExpenses.length === 0 && (
              <p className="text-xs text-gray-400">Aucune dépense pour l'instant.</p>
            )}

            {realExpenses.map((expense) => {
              const canModifyExpense = expense.paidBy?.id === currentUser?.id || canManageWidgets;
              const isDeleting = deletingId === expense.id;

              return (
                <div key={expense.id} className="flex items-center gap-2 rounded-golden bg-white px-3 py-2.5 shadow-halo">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-black text-gray-900">{expense.title}</p>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Avatar name={expense.paidBy?.name} avatar={expense.paidBy?.avatar} />
                      <span className="truncate text-[11px] font-medium text-gray-500">
                        Payé par {expense.paidBy?.name} pour {getMemberNameList(expense.participants)}
                      </span>
                    </div>
                    {expense.participants.length === 1 && expense.participants[0]?.id === expense.paidBy?.id && (
                      <p className="text-[10px] font-bold text-amber-700">
                        Aucun remboursement : dépense personnelle.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-black text-gray-900">{formatAmount(expense.amount, currency)}</span>
                    {canModifyExpense && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(expense)}
                          onPointerDown={(event) => event.stopPropagation()}
                          className="text-[11px] font-bold text-gray-400 transition hover:text-amber-600 cursor-pointer"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          onPointerDown={(event) => event.stopPropagation()}
                          disabled={isDeleting}
                          className="text-[11px] font-bold text-gray-400 transition hover:text-red-500 cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? '...' : 'Suppr.'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetCardShell>
  );
}
