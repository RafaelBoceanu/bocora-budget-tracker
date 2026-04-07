// src/lib/stats.ts
import { differenceInDays, parseISO, format, eachDayOfInterval } from 'date-fns';
import type { Trip, Category } from './types';
import { BUDGET_BY_COUNTRY } from './countryData';

export function getTripDays(trip: Trip): number {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = parseISO(trip.startDate);
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.max(1, differenceInDays(todayMidnight, startMidnight) + 1);
}

export function getTotalHome(trip: Trip): number {
  return parseFloat(trip.expenses.reduce((s, e) => s + e.amountHome, 0).toFixed(2));
}

export function getTotalUSD(trip: Trip): number {
  return parseFloat(trip.expenses.reduce((s, e) => s + e.amountUSD, 0).toFixed(2));
}

export function getAverageDailyHome(trip: Trip): number {
  const days = getTripDays(trip);
  return parseFloat((getTotalHome(trip) / days).toFixed(2));
}

export function getDailyTotals(trip: Trip): Record<string, number> {
  return trip.expenses.reduce((acc, e) => {
    acc[e.date] = parseFloat(((acc[e.date] ?? 0) + e.amountHome).toFixed(2));
    return acc;
  }, {} as Record<string, number>);
}

export function getDailySpendSeries(trip: Trip): Array<{ date: string; total: number; cumulative: number }> {
  const start = parseISO(trip.startDate);
  const today = new Date();
  const days = eachDayOfInterval({ start, end: today });
  const totals = getDailyTotals(trip);
  let running = 0;
  return days.map(d => {
    const key = format(d, 'yyyy-MM-dd');
    const total = totals[key] ?? 0;
    running = parseFloat((running + total).toFixed(2));
    return { date: key, total, cumulative: running };
  });
}

export function getSpendByCategory(trip: Trip): Array<{ category: Category; total: number; pct: number }> {
  const totals = trip.expenses.reduce((acc, e) => {
    acc[e.category] = parseFloat(((acc[e.category] ?? 0) + e.amountHome).toFixed(2));
    return acc;
  }, {} as Record<string, number>);
  const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
  return (Object.entries(totals) as [Category, number][])
    .map(([category, total]) => ({ category, total, pct: Math.round((total / grand) * 100) }))
    .sort((a, b) => b.total - a.total);
}

export function getSpendByCountry(trip: Trip): Array<{ country: string; total: number; days: number; avgPerDay: number }> {
  const totals: Record<string, { total: number; dates: Set<string> }> = {};
  for (const e of trip.expenses) {
    if (!totals[e.country]) totals[e.country] = { total: 0, dates: new Set() };
    totals[e.country].total = parseFloat((totals[e.country].total + e.amountHome).toFixed(2));
    totals[e.country].dates.add(e.date);
  }
  return Object.entries(totals)
    .map(([country, { total, dates }]) => ({
      country,
      total,
      days: dates.size,
      avgPerDay: parseFloat((total / dates.size).toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total);
}

export function getRollingAverage(trip: Trip, window = 7): Array<{ date: string; avg: number }> {
  const series = getDailySpendSeries(trip);
  return series.map((point, i) => {
    const slice = series.slice(Math.max(0, i - window + 1), i + 1);
    const avg = parseFloat((slice.reduce((s, p) => s + p.total, 0) / slice.length).toFixed(2));
    return { date: point.date, avg };
  });
}

export function getBudgetPace(trip: Trip): {
  daysIn: number;
  avgPerDay: number;
  budget: number;
  surplusPerDay: number;
  onTrack: boolean;
} {
  const daysIn = getTripDays(trip);
  const avgPerDay = getAverageDailyHome(trip);
  const budget = Math.max(trip.dailyBudgetHome, 0.01);
  const surplusPerDay = parseFloat((budget - avgPerDay).toFixed(2));
  return {
    daysIn,
    avgPerDay,
    budget,
    surplusPerDay,
    onTrack: avgPerDay <= budget,
  };
}

export function getBenchmark(country: string): number | null {
  return BUDGET_BY_COUNTRY[country] ?? null;
}