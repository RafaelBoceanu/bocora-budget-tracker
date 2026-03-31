// src/lib/constants.ts
import type { Category } from './types';

export const CATEGORY_LABELS: Record<Category, string> = {
    accomodation: 'Accomodation',
    food:         'Food & Drink',
    transport:    'Transport',
    activities:   'Activities',
    shopping:     'Shopping',
    health:       'Health',
    other:        'Other',
};

export const CATEGORY_COLORS: Record<Category, string> = {
    accomodation: '#3B82F6',
    food:         '#F59E0B',
    transport:    '#8B5CF6',
    activities:   '#10B981',
    shopping:     '#EC4899',
    health:       '#EF4444',
    other:        '#6B7280',
};

export const CATEGORY_ICONS : Record<string, string> = {
  accomodation: '🏨',
  food: '🍜',
  transport: '🚌',
  activities: '🎭',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
};

export const HOME_CURRENCIES = [
  'USD','EUR','GBP','AUD','CAD','CHF','JPY','SGD','NZD',
  'SEK','NOK','DKK','PLN','CZK','HUF','MXN','BRL','INR','ZAR',
];