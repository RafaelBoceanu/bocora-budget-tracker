// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { loadTrips } from './lib/storage';
import { useCountryData } from './lib/countryData';
import { useOffline } from './lib/useOffline';
import type { Trip, Expense } from './lib/types';

import { TripsView }   from './components/TripsView';
import { NewTripView } from './components/NewTripView';
import { TripDetail }  from './components/TripDetail';
import { ExpenseForm } from './components/ExpenseForm';

import './App.css';

type View = 'trips' | 'new-trip' | 'detail' | 'add' | 'edit-expense';

export default function App() {
  const { countries, loadState } = useCountryData();
  const isOffline = useOffline();

  const [trips, setTrips]           = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [view, setView]             = useState<View>('trips');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => { setTrips(loadTrips()); }, []);

  const refresh = useCallback(() => {
    const fresh = loadTrips();
    setTrips(fresh);
    setActiveTrip(prev => prev ? (fresh.find(t => t.id === prev.id) ?? null) : null);
  }, []);

  const goToTrips = () => { setActiveTrip(null); setView('trips'); };
  const goToDetail = (trip?: Trip) => {
    if (trip) setActiveTrip(trip);
    setView('detail');
    setEditingExpense(null);
  };

  return (
    <>
      {isOffline && (
        <div className="offline-banner">
          ✈️ Offline — currency rates may not be current
        </div>
      )}

      {view === 'trips' && (
        <TripsView
          trips={trips}
          onSelectTrip={trip => goToDetail(trip)}
          onNewTrip={() => setView('new-trip')}
          onRefresh={refresh}
        />
      )}

      {view === 'new-trip' && (
        <NewTripView
          onBack={goToTrips}
          onCreated={trip => { refresh(); goToDetail(trip); }}
        />
      )}

      {view === 'detail' && activeTrip && (
        <TripDetail
          trip={activeTrip}
          countries={countries}
          onBack={goToTrips}
          onAddExpense={() => setView('add')}
          onEditExpense={expense => { setEditingExpense(expense); setView('edit-expense'); }}
        />
      )}

      {view === 'add' && activeTrip && (
        <ExpenseForm
          trip={activeTrip}
          countries={countries}
          countriesReady={loadState === 'ready'}
          onBack={() => goToDetail()}
          onSaved={() => { refresh(); goToDetail(); }}
        />
      )}

      {view === 'edit-expense' && activeTrip && editingExpense && (
        <ExpenseForm
          trip={activeTrip}
          countries={countries}
          countriesReady={loadState === 'ready'}
          editingExpense={editingExpense}
          onBack={() => goToDetail()}
          onSaved={() => { refresh(); goToDetail(); }}
        />
      )}

      {/* Fallback: if view/state mismatch, go home */}
      {view === 'detail' && !activeTrip && (
        <TripsView
          trips={trips}
          onSelectTrip={trip => goToDetail(trip)}
          onNewTrip={() => setView('new-trip')}
          onRefresh={refresh}
        />
      )}
    </>
  );
}