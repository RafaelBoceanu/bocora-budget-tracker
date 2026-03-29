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

// Crowdsourced average daily budgets in USD (for backpackers)
export const COUNTRY_BUDGETS: Record<string, number> = {
    'Thailand':    35,
    'Vietnam':     30,
    'Indonesia':   35,
    'Cambodia':    30,
    'Laos':        25,
    'Myanmar':     30,
    'Philippines': 35,
    'Malaysia':    45,
    'India':       25,
    'Nepal':       25,
    'Portugal':    65,
    'Spain':       70,
    'Italy':       80,
    'Greece':      60,
    'Germany':     75,
    'Czech Republic':  55,
    'Hungary':     50,
    'Poland':      50,
    'Croatia':     65,
    'Mexico':      45,
    'Colombia':    40,
    'Peru':        40,
    'Bolivia':     30,
    'Argentina':   45,
    'Brazil':      50,
    'Morocco':     40,
    'South Africa':50,
    'Japan':       80,
    'South Korea': 60,
    'Taiwan':      50,
};