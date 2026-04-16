import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api, { getApiErrorMessage } from '../../api/axiosConfig';
import useAuthStore from '../../store/authStore';
import WidgetCardShell from './WidgetCardShell';
import { formatAmount, getCurrencySymbol } from '../../utils/tricount';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
function Avatar({ name, avatar }) {
  const initials = (name || '?').slice(0, 1).toUpperCase();
  if (avatar) return <img src={avatar} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />;
  return (
    <span className="w-6 h-6 inline-flex shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-[10px] font-black">
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Modal ajout dépense
// ---------------------------------------------------------------------------
function AddExpenseModal({ members, currency, currentUser, onClose, onSubmit, isSubmitting, error }) {
  const [draft, setDraft] = useState({
    title: '',
    amount: '',
    participants: members.map((m) => m.id),
  });

  const amount = parseFloat(draft.amount) || 0;
  const nbParticipants = draft.participants.length;
  const sharePerPerson = nbParticipants > 0 ? amount / nbParticipants : 0;
  const debtors = members.filter((m) => m.id !== currentUser?.id && draft.participants.includes(m.id));

  const toggle = (id) => setDraft((prev) => ({
    ...prev,
    participants: prev.participants.includes(id)
      ? prev.participants.filter((p) => p !== id)
      : [...prev.participants, id],
  }));

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-black text-gray-900">Nouvelle dépense</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(draft); }} className="flex flex-col gap-4">
          {/* Payé par */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">Payé par</span>
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-gray-900">
                {(currentUser?.name || '?').slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sm font-bold text-gray-900">{currentUser?.name || 'Moi'}</span>
              <span className="ml-auto text-[11px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">vous</span>
            </div>
          </div>

          {/* Description */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">Description</span>
            <input
              type="text" value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="Restaurant, Hôtel, Courses…"
              className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
          </label>

          {/* Montant */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">Montant payé ({getCurrencySymbol(currency)})</span>
            <input
              type="number" min="0.01" step="0.01" value={draft.amount}
              onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
              placeholder="0,00"
              className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          {/* Pour qui */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-500">Pour qui as-tu payé ?</span>
            <div className="flex flex-col gap-1.5">
              {members.map((m) => {
                const isMe = m.id === currentUser?.id;
                const active = draft.participants.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggle(m.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition cursor-pointer border-2 ${
                      active ? 'bg-amber-50 border-amber-300 text-gray-900' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${active ? 'bg-amber-400 text-gray-900' : 'bg-gray-200 text-gray-500'}`}>
                        {(m.name || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <span>{m.name}</span>
                      {isMe && <span className="text-[10px] text-amber-600 font-bold">(vous)</span>}
                    </div>
                    {active && amount > 0 && (
                      <span className="text-sm font-black text-amber-700">{formatAmount(sharePerPerson, currency)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Récap */}
          {debtors.length > 0 && amount > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Ils te doivent</p>
              {debtors.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-0.5">
                  <span className="text-sm font-semibold text-gray-700">{d.name}</span>
                  <span className="text-sm font-black text-red-500">{formatAmount(sharePerPerson, currency)}</span>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={isSubmitting || draft.participants.length === 0}
            className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-gray-900 hover:brightness-105 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement…' : 'Ajouter la dépense'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Carte principale
// ---------------------------------------------------------------------------
export default function TricountWidgetCard(props) {
  const { widget, canManageWidgets = false } = props;

  const currency = widget.data?.currency || 'EUR';
  const title = widget.data?.title || 'Tricount';
  const groupId = widget.groupId;
  const widgetId = widget.id;

  const currentUser = useAuthStore((s) => s.user);

  const [state, setState] = useState({ expenses: [], members: [], balances: {}, debts: [], loaded: false });
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settlingKey, setSettlingKey] = useState(null);

  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  const fetchData = useCallback(async () => {
    if (!groupId || !widgetId) return;
    try {
      const { data } = await api.get(`/groups/${groupId}/widgets/${widgetId}/expenses`);
      if (isMounted.current) setState({ ...data, loaded: true });
    } catch {
      if (isMounted.current) setState((p) => ({ ...p, loaded: true }));
    }
  }, [groupId, widgetId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddExpense = async (draft) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/groups/${groupId}/widgets/${widgetId}/expenses`, {
        title: draft.title,
        amount: parseFloat(draft.amount),
        participants: draft.participants,
      });
      if (isMounted.current) { setState({ ...data, loaded: true }); setShowModal(false); }
    } catch (err) {
      if (isMounted.current) setSubmitError(getApiErrorMessage(err));
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    setDeletingId(id);
    try {
      const { data } = await api.delete(`/groups/${groupId}/widgets/${widgetId}/expenses/${id}`);
      if (isMounted.current) setState({ ...data, loaded: true });
    } catch { /* ignore */ } finally {
      if (isMounted.current) setDeletingId(null);
    }
  };

  const handleSettle = async (fromId, toId, amount) => {
    const key = `${fromId}-${toId}`;
    setSettlingKey(key);
    try {
      const { data } = await api.post(`/groups/${groupId}/widgets/${widgetId}/expenses/settle`, { fromId, toId, amount });
      if (isMounted.current) setState({ ...data, loaded: true });
    } catch { /* ignore */ } finally {
      if (isMounted.current) setSettlingKey(null);
    }
  };

  const openModal = () => { setSubmitError(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSubmitError(null); };

  const { expenses, members, balances, debts } = state;
  const isRect = widget.size === 'RECT';

  const modalProps = {
    members, currency, currentUser,
    onClose: closeModal,
    onSubmit: handleAddExpense,
    isSubmitting,
    error: submitError,
  };

  // ── SQUARE ────────────────────────────────────────────────────────────────
  if (!isRect) {
    const topDebt = debts[0];
    return (
      <WidgetCardShell {...props} typeLabel="Tricount"
        style={{ background: 'linear-gradient(135deg,#92400e 0%,#d97706 55%,#78350f 100%)', color: '#FFF7ED' }}
        controlsTone="light"
      >
        {showModal && <AddExpenseModal {...modalProps} />}
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[clamp(0.9rem,3vw,1.1rem)] font-black leading-tight text-amber-50 line-clamp-2">{title}</p>
            <button type="button" onClick={openModal} onPointerDown={(e) => e.stopPropagation()}
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div>
            {!state.loaded && <p className="text-xs text-amber-200/80">Chargement…</p>}
            {state.loaded && expenses.length === 0 && <p className="text-xs font-medium text-amber-200/80">Aucune dépense</p>}
            {state.loaded && topDebt && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/70">À rembourser</p>
                <p className="mt-0.5 text-xs font-black text-white truncate">{topDebt.fromName} → {topDebt.toName}</p>
                <p className="text-base font-black text-amber-300">{formatAmount(topDebt.amount, currency)}</p>
              </div>
            )}
            {state.loaded && debts.length === 0 && expenses.length > 0 && (
              <p className="text-sm font-bold text-amber-200">Tout est réglé ✓</p>
            )}
            <p className="mt-1 text-[11px] font-semibold text-amber-300/70">
              {expenses.filter(e => !e.isSettlement).length} dépense{expenses.filter(e => !e.isSettlement).length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </WidgetCardShell>
    );
  }

  // ── RECT ──────────────────────────────────────────────────────────────────
  const realExpenses = expenses.filter((e) => !e.isSettlement);

  return (
    <WidgetCardShell {...props} typeLabel="Tricount" showTypeLabel={false}
      style={{ backgroundColor: '#fffbeb' }}
      controlsTone="dark"
    >
      {showModal && <AddExpenseModal {...modalProps} />}

      {/* Layout principal : deux colonnes */}
      <div className="flex h-full min-h-0 gap-5 overflow-hidden">

        {/* ── Colonne gauche : dettes ─────────────────────────────────────── */}
        <div className="flex w-[45%] shrink-0 flex-col min-h-0">
          {/* En-tête colonne gauche */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/60">Tricount</p>
              <p className="text-base font-black text-gray-900 leading-tight">{title}</p>
            </div>
            <button type="button" onClick={openModal} onPointerDown={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-gray-900 hover:brightness-105 transition cursor-pointer shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>

          {/* Zone dettes scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">

            {/* Aucune dépense */}
            {!state.loaded && <p className="text-xs text-gray-400 font-medium">Chargement…</p>}
            {state.loaded && realExpenses.length === 0 && (
              <p className="text-xs text-gray-400 font-medium">Ajoutez la première dépense →</p>
            )}

            {/* Tout réglé */}
            {state.loaded && debts.length === 0 && realExpenses.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-800">Tout le monde est quitte !</p>
                  <p className="text-[11px] text-emerald-600 font-medium">{realExpenses.length} dépense{realExpenses.length > 1 ? 's' : ''} partagée{realExpenses.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* Liste des dettes */}
            {state.loaded && debts.map((d) => {
              const key = `${d.fromId}-${d.toId}`;
              const isSettling = settlingKey === key;
              return (
                <div key={key} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {/* Partie info */}
                  <div className="px-3 py-2.5">
                    {/* Montant en évidence */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Doit rembourser</span>
                      <span className="text-base font-black text-red-500">{formatAmount(d.amount, currency)}</span>
                    </div>
                    {/* Qui → qui */}
                    <div className="flex items-center gap-2">
                      <Avatar name={d.fromName} />
                      <span className="text-sm font-bold text-gray-800">{d.fromName}</span>
                      <svg className="w-4 h-4 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <Avatar name={d.toName} />
                      <span className="text-sm font-bold text-gray-800">{d.toName}</span>
                    </div>
                  </div>
                  {/* Bouton réglé */}
                  <button
                    type="button"
                    disabled={isSettling}
                    onClick={() => handleSettle(d.fromId, d.toId, d.amount)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSettling ? (
                      <span>Enregistrement…</span>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Marquer comme réglé
                      </>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Soldes */}
            {state.loaded && members.length > 0 && (
              <div className="mt-1 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Soldes</p>
                <div className="flex flex-col gap-1.5">
                  {members.map((m) => {
                    const b = balances[m.id] ?? 0;
                    const pos = b > 0.005;
                    const neg = b < -0.005;
                    return (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={m.name} avatar={m.avatar} />
                          <span className="text-xs font-semibold text-gray-700">{m.name}</span>
                        </div>
                        <span className={`text-xs font-black ${pos ? 'text-emerald-600' : neg ? 'text-red-500' : 'text-gray-400'}`}>
                          {pos ? '+' : ''}{formatAmount(b, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Séparateur */}
        <div className="w-px shrink-0 bg-gray-200 self-stretch" />

        {/* ── Colonne droite : liste des dépenses ─────────────────────────── */}
        <div className="flex flex-1 min-w-0 flex-col min-h-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 shrink-0">
            Dépenses ({realExpenses.length})
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
            {realExpenses.length === 0 && (
              <p className="text-xs text-gray-400">Aucune dépense pour l'instant.</p>
            )}
            {realExpenses.map((expense) => {
              const canDelete = expense.paidBy?.id === currentUser?.id || canManageWidgets;
              const isDeleting = deletingId === expense.id;
              return (
                <div key={expense.id} className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-2.5 py-2 shadow-sm">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-xs font-bold text-gray-900 truncate">{expense.title}</p>
                    <div className="flex items-center gap-1">
                      <Avatar name={expense.paidBy?.name} avatar={expense.paidBy?.avatar} />
                      <span className="text-[11px] text-gray-500 truncate">
                        {expense.paidBy?.name} · {expense.participants.map((p) => p.name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-black text-gray-900">{formatAmount(expense.amount, currency)}</span>
                    {canDelete && (
                      <button type="button" onClick={() => handleDeleteExpense(expense.id)}
                        onPointerDown={(e) => e.stopPropagation()} disabled={isDeleting}
                        className="text-[11px] font-semibold text-gray-300 hover:text-red-500 transition cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? '…' : 'Suppr.'}
                      </button>
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
