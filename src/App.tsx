// src/App.tsx
import { useState, useEffect } from 'react'
import { loadTrips, saveTrip, deleteTrip } from './lib/storage'
import { toUSD } from './lib/currency'
import { getAverageDailySpend, getBenchmark, getTripDays } from './lib/stats'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './lib/constants'
import type { Trip, Expense, Category } from './lib/types';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [view, setView] = useState<'trips' | 'detail' | 'add' | 'new-trip'>('trips');
  // Add expense from state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');
  const [country, setCountry] = useState('');
  // New trip form state
  const [tripName, setTripName] = useState('');
  const [tripCurrency, setTripCurrency] = useState('USD');
  const [tripBudget, setTripBudget] = useState('');
  
  useEffect(() => { setTrips(loadTrips()); }, []);

  const refresh = () => {
    const fresh = loadTrips();
    setTrips(fresh);
    if (activeTrip) setActiveTrip(fresh.find(t => t.id === activeTrip.id) ?? null);
  };

  const handleCreateTrip = () => {
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: tripName || 'My Trip',
      currency: tripCurrency,
      dailyBudgetUSD: parseFloat(tripBudget) || 50,
      startDate: new Date().toISOString().split('T')[0],
      expenses: [],
    };
    saveTrip(trip);
    refresh();
    setView('trips');
    setTripName(''); setTripCurrency('USD'); setTripBudget('');
  };

  const handleAddExpense = async () => {
    if (!activeTrip || !amount) return;
    const amountNum = parseFloat(amount);
    const amountUSD = await toUSD(amountNum, activeTrip.currency);
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: amountNum,
      amountUSD,
      category,
      note,
      date: new Date().toISOString().split('T')[0],
      country: country || 'Unknown',
    };
    const updated = { ...activeTrip, expenses: [...activeTrip.expenses, expense] };
    saveTrip(updated);
    refresh();
    setAmount(''); setNote(''); setView('detail');
  };

  // TRIP LIST VIEW
  if (view === 'trips') return (
    <div className='max-w-md mx-auto px-4 py-6 space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-bold'>My Trips</h1>
        <button onClick={() => setView('new-trip')}
          className='bg-green-700 text-white text-sm px-3 py-1.5 rounded'>
            New Trip
          </button>
      </div>
      {trips.length === 0 && <p className='text-gray-500 text-sm'>No trips yet</p>}
      {trips.map(trip => {
        const avg = getAverageDailySpend(trip);
        const over = avg > trip.dailyBudgetUSD;
        return (
          <div key={trip.id} onClick={() => { setActiveTrip(trip); setView('detail'); }}
            className='border rounded-xl p-4 cursor-pointer hover:bg-gray-50'>
            <div className='flex justify-between'>
              <p className='font-semibold'>{trip.name}</p>
              <p className={`text-sm font-medium ${over ? 'text-red-600' : 'text-green-700'}`}>
                ${avg}/day
              </p>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              {getTripDays(trip)} days ; budget ${trip.dailyBudgetUSD}/day ; {trip.expenses.length} expenses
            </p>
          </div>
        );
      })}
    </div>
  );

  // NEW TRIP VIEW
  if (view === 'new-trip') return (
    <div className='max-w-md mx-auto px-4 py-6 space-y-4'>
      <button onClick={() => setView('trips')} className='text-sm text-gray-500'>Back</button>
      <h2 className='font-bold text-lg'>New Trip</h2>
      <input className='w-full border rounded px-3 py-2 text-sm'
        placeholder='Trip name' value={tripName} onChange={e => setTripName(e.target.value)} />
      <input className='w-full border rounded px-3 py-2 text-sm' type='number'
        placeholder='Daily budget (USD)' value={tripBudget} onChange={e => setTripBudget(e.target.value)} />
      <input className='w-full border rounded px-3 py-2 text-sm'
        placeholder='Currency code (e.g. THB)' value={tripCurrency} onChange={e => setTripCurrency(e.target.value.toUpperCase())} />
      <button onClick={handleCreateTrip}
        className='w-full bg-green-700 text-white py-2 rounded text-sm'>
        Create Trip
      </button>
    </div>
  );

  // TRIP DETAIL VIEW
  if (view === 'detail' && activeTrip) {
    const avg = getAverageDailySpend(activeTrip);
    const benchmark = activeTrip.expenses[0]?.country ? getBenchmark(activeTrip.expenses[0].country) : null;
    const over = avg > activeTrip.dailyBudgetUSD;
    return (
      <div className='max-w-md mx-auto px-4 py-6 space-y-4'>
        <div className='flex justify-between items-center'>
          <button onClick={() => setView('trips')} className='text-sm text-gray-500'>Trips</button>
          <button onClick={() => setView('add')}
            className='bg-green-700 text-white text-sm px-3 py-1.5 rounded'>
              + Expense
            </button>
        </div>
        <h2 className='font-bold text-lg'>{activeTrip.name}</h2>
        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-gray-50 rounded-xl p-3'>
            <p className='text-xs text-gray-500'>Average daily spend</p>
            <p className={`text-xl font-bold ${over ? 'text-red-600' : 'text-green-700'}`}>${avg}</p>
          </div>
          <div className='bg-gray-50 rounded-xl p-3'>
            <p className='text-xs text-gray-500'>Your budget</p>
            <p className='text-xl font-bold'>${activeTrip.dailyBudgetUSD}</p>
          </div>
          {benchmark && (
            <div className='bg-gray-50 rounded-xl p-3 col-span-2'>
              <p className='text-xs text-gray-500'>Typical backpacker in this country</p>
              <p className='text-lg font-semibold'>${benchmark}/day</p>
              <p className='text-xs mt-1 text-gray-500'>
                You are spending {avg < benchmark ? `$${(benchmark - avg).toFixed(0)} less` : `$${(avg - benchmark).toFixed(0)} more`} than average
              </p>
            </div>
          )}
        </div>
        <div className='space-y-2 mt-2'>
          {[...activeTrip.expenses].reverse().map(e => (
            <div key={e.id} className='flex justify-between items-center border rounded-lg px-3 py-2'>
              <div className='flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full inline-block'
                  style={{ background: CATEGORY_COLORS[e.category] }} />
                <div>
                  <p className='text-sm font-medium'>{CATEGORY_LABELS[e.category]}</p>
                  {e.note && <p className='text-xs text-gray-500'>{e.note}</p>}
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold'>{activeTrip.currency}</p>
                <p className='text-xs text-gray-400'>${e.amountUSD}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ADD EXPENSE VIEW
  if (view === 'add' && activeTrip) return (
    <div className='max-w-md mx-auto px-4 py-6 space-y-4'>
      <button onClick={() => setView('detail')} className='text-sm text-gray-500'>Back</button>
      <h2 className='font-bold text-lg'>Add Expense</h2>
      <input className='w-full border rounded px-3 py-2 text-sm' type='number'
        placeholder={`Amount (${activeTrip.currency})`} value={amount} onChange={e => setAmount(e.target.value)} />
      <div className='grid grid-cols-3 gap-2'>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`text-xs py-2 px-1 rounded-lg border transition-colors ${category === cat ? 'text-white' : 'bg-white'}`}
            style={category === cat ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] } : {}}>
              {CATEGORY_LABELS[cat]}
            </button>
        ))}
      </div>
      <input className='w-full border rounded px-3 py-2 text-sm'
        placeholder='Country' value={country} onChange={e => setCountry(e.target.value)} />
      <input className='w-full border rounded px-3 py-2 text-sm'
        placeholder='Note (optional)' value={note} onChange={e => setNote(e.target.value)} />
      <button onClick={handleAddExpense} disabled={!amount}
        className='w-full bg-green-700 text-white py-2 rounded text-sm disabled:opacity-50'>
          Save Expense
        </button>
    </div>
  );

  return null;
}