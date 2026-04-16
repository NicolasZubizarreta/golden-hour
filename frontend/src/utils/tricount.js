export const TRICOUNT_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'];

export const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'AU$',
};

export const getCurrencySymbol = (currency) => CURRENCY_SYMBOLS[currency] || currency;

export const formatAmount = (amount, currency = 'EUR') => {
  const symbol = getCurrencySymbol(currency);
  const formatted = Math.abs(amount).toFixed(2).replace('.', ',');
  return `${symbol}\u00A0${formatted}`;
};

// --- Helpers draft pour le formulaire de création du widget ---

export const createDefaultTricountDraft = () => ({
  title: '',
  currency: 'EUR',
});

export const createTricountDraftFromData = (data) => ({
  title: data?.title || '',
  currency: data?.currency || 'EUR',
});

export const buildTricountPayloadFromDraft = (draft) => ({
  payload: {
    title: draft.title.trim() || 'Tricount',
    currency: draft.currency || 'EUR',
  },
});

// --- Helper draft pour le formulaire d'ajout de dépense ---

export const createDefaultExpenseDraft = (memberIds = []) => ({
  title: '',
  amount: '',
  participants: [...memberIds],
});
