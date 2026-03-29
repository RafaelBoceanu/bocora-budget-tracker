// src/lib/storage.ts
import type { Trip } from './types'

const KEY = 'backpacker-trips';

export const loadTrips = (): Trip[] => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
};

export const saveTrip = (trip: Trip): void => {
    const trips = loadTrips();
    const idx = trips.findIndex(t => t.id === trip.id);
    if (idx >= 0) trips[idx] = trip;
    else trips.unshift(trip);
    localStorage.setItem(KEY, JSON.stringify(trips));
};

export const deleteTrip = (id: string): void => {
    localStorage.setItem(KEY, JSON.stringify(loadTrips().filter(t => t.id !== id)));
};