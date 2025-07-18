import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export const currencies: Currency[] = [
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' }
];

export const languages = [
  { code: 'cs', name: 'Čeština' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' }
];

export const currencyAtom = atomWithStorage<Currency>(
  'settings.currency',
  currencies.find(c => c.code === 'CZK') || currencies[0]
);

export const languageAtom = atomWithStorage<string>(
  'settings.language',
  'cs'
);

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
  }).format(amount);
}