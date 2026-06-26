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
  const numericAmount = Number(amount) || 0;
  const symbol = getCurrencySymbol(currency);
  const formatted = Math.abs(numericAmount).toFixed(2).replace('.', ',');
  const sign = numericAmount < 0 ? '-' : '';
  return `${sign}${symbol}\u00A0${formatted}`;
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

export const isTricountWidgetSizeAllowed = (widgetSize) => widgetSize === 'RECT';

export const buildTricountPayloadFromDraft = (draft, widgetSize) => {
  if (widgetSize && !isTricountWidgetSizeAllowed(widgetSize)) {
    return { error: 'Le widget Tricount est disponible uniquement en format rectangle.' };
  }

  return {
    payload: {
      title: draft.title.trim() || 'Tricount',
      currency: draft.currency || 'EUR',
    },
  };
};

// --- Helper draft pour le formulaire d'ajout de dépense ---

export const createDefaultExpenseDraft = (memberIds = []) => ({
  title: '',
  amount: '',
  paidById: '',
  participants: [...memberIds],
});
