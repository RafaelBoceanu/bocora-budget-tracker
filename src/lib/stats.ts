// src/lib/stats.ts
import { format, differenceInDays, parseISO } from 'date-fns';
import type { Trip, Category } from './types';
import { COUNTRY_BUDGETS } from './constants';

export function getDailyTotals(trip: Trip): Record<string, number> {
    return trip.expenses.reduce((acc, e) => {
        acc[e.date] = (acc[e.date] ?? 0) + e.amountUSD;
        return acc;
    }, {} as Record<string, number>);
}

export function getTotalByCategory(trip: Trip): Record<Category, number> {
    return trip.expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amountUSD;
        return acc;
    }, {} as Record<Category, number>);
}

export function getTripDays(trip: Trip): number {
    return Math.max(1, differenceInDays(new Date(), parseISO(trip.startDate)) + 1);
}

export function getAverageDailySpend(trip: Trip): number {
    const days = getTripDays(trip);
    const total = trip.expenses.reduce((s, e) => s + e.amountUSD, 0);
    return parseFloat((total / days).toFixed(2));
}

export function getBenchmark(country: string): number | null {
    return COUNTRY_BUDGETS[country] ?? null;
}