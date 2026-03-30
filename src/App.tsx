// src/App.tsx
import { useMemo, useState, useEffect, useRef  } from 'react'
import { loadTrips, saveTrip, deleteTrip } from './lib/storage'
import { convertCurrency } from './lib/currency'
import {
  getAverageDailyHome, getBudgetPace, getDailySpendSeries,
  getSpendByCategory, getSpendByCountry, getRollingAverage,
  getTotalHome, getTripDays, getBenchmark,
} from './lib/stats'
import {
  CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS,
  COUNTRY_CURRENCIES, COUNTRY_FLAGS, HOME_CURRENCIES,
} from './lib/constants'
import type { Trip, Expense, Category } from './lib/types'
import './App.css'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]
const ALL_COUNTRIES = Object.keys(COUNTRY_CURRENCIES).sort()

// ─── small helpers ──────────────────────────────────────────────────────────
const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)

const fmtShort = (n: number, currency: string) => {
  if (n >= 1000) return `${currency} ${(n / 1000).toFixed(1)}k`
  return `${currency} ${n.toFixed(0)}`
}

// ─── Sub-components ────────────────────────────────────────────────────────

/** Animated SVG donut chart */
function DonutChart({ data, currency }: {
  data: Array<{ category: Category; total: number; pct: number }>,
  currency: string,
}) {
  const size = 110
  const r = 40
  const cx = size / 2
  const circumference = 2 * Math.PI * r

  let offset = 0
  const slices = data.map(d => {
    const dash = (d.pct / 100) * circumference
    const gap = circumference - dash
    const rotate = (offset / 100) * 360 - 90
    offset += d.pct
    return { ...d, dash, gap, rotate }
  })

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <circle key={i}
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={CATEGORY_COLORS[s.category]}
            strokeWidth={14}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeLinecap="butt"
            transform={`rotate(${s.rotate} ${cx} ${cx})`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        <circle cx={cx} cy={cx} r={33} fill="#fff" />
        <text x={cx} y={cx - 5} textAnchor="middle" fontSize="9" fill="#9a9088" fontWeight="600" fontFamily="DM Sans">TOTAL</text>
        <text x={cx} y={cx + 10} textAnchor="middle" fontSize="12" fill="#1a1714" fontWeight="700" fontFamily="Playfair Display, serif">
          {fmtShort(data.reduce((s, d) => s + d.total, 0), currency)}
        </text>
      </svg>
      <div className="donut-legend">
        {data.slice(0, 6).map(d => (
          <div key={d.category} className="legend-row">
            <span className="legend-dot" style={{ background: CATEGORY_COLORS[d.category] }} />
            <span className="legend-label">{CATEGORY_LABELS[d.category]}</span>
            <span className="legend-pct">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** SVG cumulative spend line chart */
function LineChart({ series, budget }: {
  series: Array<{ date: string; cumulative: number }>,
  budget: number,
  currency: string,
}) {
  const W = 320, H = 80, PAD = 4
  if (series.length < 2) return null

  const maxVal = Math.max(series[series.length - 1].cumulative, budget * series.length)
  const xScale = (i: number) => PAD + (i / (series.length - 1)) * (W - PAD * 2)
  const yScale = (v: number) => H - PAD - (v / maxVal) * (H - PAD * 2)

  const points = series.map((p, i) => `${xScale(i)},${yScale(p.cumulative)}`).join(' ')
  const budgetY = yScale(budget * series.length)
  const areaPath = `M${xScale(0)},${H} ` +
    series.map((p, i) => `L${xScale(i)},${yScale(p.cumulative)}`).join(' ') +
    ` L${xScale(series.length - 1)},${H} Z`

  const firstDate = series[0].date.slice(5) // MM-DD
  const lastDate = series[series.length - 1].date.slice(5)
  const midDate = series[Math.floor(series.length / 2)]?.date.slice(5)

  return (
    <div>
      <svg className="line-chart-wrap" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 80, width: '100%' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* area fill */}
        <path d={areaPath} fill="url(#lineGrad)" />
        {/* budget pace line */}
        {budgetY > PAD && budgetY < H && (
          <line x1={PAD} y1={budgetY} x2={W - PAD} y2={budgetY}
            stroke="#c4a87a" strokeWidth="1.2" strokeDasharray="4 3" />
        )}
        {/* actual line */}
        <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* last point dot */}
        <circle cx={xScale(series.length - 1)} cy={yScale(series[series.length - 1].cumulative)}
          r="3.5" fill="#3B82F6" />
      </svg>
      <div className="chart-xaxis">
        <span>{firstDate}</span>
        {midDate && <span>{midDate}</span>}
        <span>{lastDate}</span>
      </div>
    </div>
  )
}

/** Daily bar chart with budget line */
function DailyBarChart({ series, budget, currency }: {
  series: Array<{ date: string; total: number }>,
  budget: number,
  currency: string,
}) {
  const recent = series.slice(-30) // last 30 days
  const maxVal = Math.max(...recent.map(d => d.total), budget, 1)
  const today = new Date().toISOString().split('T')[0]
  const budgetPct = (budget / maxVal) * 100

  const firstDate = recent[0]?.date.slice(5)
  const lastDate = recent[recent.length - 1]?.date.slice(5)

  return (
    <div className="chart-wrap">
      <div className="budget-line-label">Budget</div>
      <div className="budget-line" style={{ bottom: `${budgetPct}%`, top: 'auto', position: 'absolute' }} />
      <div className="bar-chart">
        {recent.map((d, i) => {
          const h = Math.max((d.total / maxVal) * 100, d.total > 0 ? 4 : 1)
          return (
            <div key={i} className={`bar-col ${d.total > budget ? 'over' : 'ok'} ${d.date === today ? 'today' : ''}`}
              style={{ height: `${h}%` }}
              title={`${d.date}: ${fmt(d.total, currency)}`}
            />
          )
        })}
      </div>
      <div className="chart-xaxis">
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  )
}

/** Country searchable dropdown */
function CountryPicker({ value, onChange }: {
  value: string,
  onChange: (country: string, currency: string) => void,
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const measureAndOpen = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const portal = document.getElementById('country-dd-portal')
      const outsideWrap = wrapRef.current && !wrapRef.current.contains(target)
      const outsidePortal = !portal || !portal.contains(target)
      if (outsideWrap && outsidePortal) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const reposition = () => {
      if (inputRef.current) {
        const r = inputRef.current.getBoundingClientRect()
        setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
      }
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  const filtered = ALL_COUNTRIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="country-search-wrap" ref={wrapRef}>
      <input
        ref={inputRef}
        className="input"
        placeholder="Search country..."
        value={query}
        onChange={e => { 
          const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '')
          setQuery(lettersOnly) 
          if (!open) measureAndOpen()
        }}
        onFocus={measureAndOpen}
      />
      {open && filtered.length > 0 && dropRect && (
        <div 
          id="country-dd-portal"
          className="country-dropdown"
          style={{ position: 'fixed', top: dropRect.top, width: dropRect.width, zIndex: 9999 }}
          // top:  left: dropRect.left, 
        >
          {filtered.map(country => (
            <div key={country} className="country-option"
              onMouseDown={e => {
                e.preventDefault()
                const cur = COUNTRY_CURRENCIES[country]
                onChange(country, cur)
                setQuery(country)
                setOpen(false)
              }}>
              <span className="flag">{COUNTRY_FLAGS[country] ?? '\ud83c\udf0d'}</span>
              <span>{country}</span>
              <span className="currency-tag">{COUNTRY_CURRENCIES[country]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [view, setView] = useState<'trips' | 'detail' | 'add' | 'new-trip'>('trips')
  const [detailTab, setDetailTab] = useState<'log' | 'trends'>('log')

  // Add-expense form
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [note, setNote] = useState('')
  const [expenseCountry, setExpenseCountry] = useState('')
  const [expenseCurrency, setExpenseCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const [convertedPreview, setConvertedPreview] = useState<string | null>(null)

  // New trip form
  const [tripName, setTripName] = useState('')
  const [homeCurrency, setHomeCurrency] = useState('USD')
  const [tripBudget, setTripBudget] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { setTrips(loadTrips()) }, [])

  const dailySeries = useMemo(
  () => activeTrip ? getDailySpendSeries(activeTrip) : [],
  [activeTrip]
  )

  const catBreakdown = useMemo(
  () => activeTrip ? getSpendByCategory(activeTrip) : [],
  [activeTrip]
  )

  const countryBreakdown = useMemo(
  () => activeTrip ? getSpendByCountry(activeTrip) : [],
  [activeTrip]
  )

  const pace = useMemo(
  () => activeTrip
    ? getBudgetPace(activeTrip)
    : {
        daysIn: 0,
        avgPerDay: 0,
        budget: 0,
        surplusPerDay: 0,
        projectedTotal: 0,
        onTrack: true,
      },
  [activeTrip]
  ) 

  const rolling = useMemo(
    () => activeTrip ? getRollingAverage(activeTrip, 7) : [],
    [activeTrip]
  )

  const refresh = () => {
    const fresh = loadTrips()
    setTrips(fresh)
    if (activeTrip) setActiveTrip(fresh.find(t => t.id === activeTrip.id) ?? null)
  }

  // Live conversion preview as user types amount
  useEffect(() => {
    if (!activeTrip || !amount || parseFloat(amount) <= 0) { setConvertedPreview(null); return }
    const timer = setTimeout(async () => {
      try {
        const converted = await convertCurrency(parseFloat(amount), expenseCurrency, activeTrip.homeCurrency)
        setConvertedPreview(fmt(converted, activeTrip.homeCurrency))
      } catch { setConvertedPreview(null) }
    }, 400)
    return () => clearTimeout(timer)
  }, [amount, expenseCurrency, activeTrip])

  const handleDeleteTrip = (tripId: string) => {
    deleteTrip(tripId)
    setTrips(loadTrips())
    if (activeTrip?.id === tripId) { setActiveTrip(null); setView('trips') }
    setDeleteConfirm(null)
  }

  const handleCreateTrip = () => {
    const budget = parseFloat(tripBudget)
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: tripName.trim() || 'My Trip',
      homeCurrency,
      dailyBudgetHome: isNaN(budget) || budget <= 0 ? 50 : budget,
      startDate: new Date().toISOString().split('T')[0],
      expenses: [],
    }
    saveTrip(trip)
    refresh()
    setView('trips')
    setTripName(''); setHomeCurrency('USD'); setTripBudget('')
  }

  const handleAddExpense = async () => {
    if (!activeTrip || !amount) return
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) return
    setSaving(true)

    const [amountHome, amountUSD] = await Promise.all([
      convertCurrency(amountNum, expenseCurrency, activeTrip.homeCurrency).catch(() => amountNum),
      convertCurrency(amountNum, expenseCurrency, 'USD').catch(() => amountNum),
    ])

    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: amountNum,
      currency: expenseCurrency,
      amountHome,
      amountUSD,
      category,
      note,
      date: new Date().toISOString().split('T')[0],
      country: expenseCountry || 'Unknown',
    }

    saveTrip({ ...activeTrip, expenses: [...activeTrip.expenses, expense] })
    refresh()
    setAmount(''); setNote(''); setConvertedPreview(null)
    setSaving(false)
    setView('detail')
  }

  const formatDate = (d: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (d === today) return 'Today'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  // ── TRIPS LIST ─────────────────────────────────────────────────────────────
  if (view === 'trips') return (
    <div className="app-shell">
      <div className="topbar">
        <span className="topbar-title">✈️ TravelLog</span>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}
          onClick={() => setView('new-trip')}>+ New Trip</button>
      </div>
      <div className="page">
        {trips.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-icon">🗺️</div>
            <div className="empty-title">Start your journey</div>
            <div className="empty-sub" style={{ marginBottom: 24 }}>
              Create your first trip to start tracking expenses in any currency.
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setView('new-trip')}>+ Create a trip</button>
          </div>
        ) : (
          <>
            <div className="section-header">{trips.length} trip{trips.length !== 1 ? 's' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trips.map((trip, i) => {
                const avg = getAverageDailyHome(trip)
                const over = avg > trip.dailyBudgetHome
                const pct = Math.min((avg / trip.dailyBudgetHome) * 100, 100)
                const days = getTripDays(trip)
                const total = getTotalHome(trip)
                return (
                  <div key={trip.id} className="card card-press animate-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => { setActiveTrip(trip); setView('detail'); setDetailTab('log') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: '#1a1714' }}>{trip.name}</div>
                        <div style={{ fontSize: 12, color: '#9a9088', marginTop: 2 }}>
                          {days} day{days !== 1 ? 's' : ''} · {trip.homeCurrency} · {fmt(trip.dailyBudgetHome, trip.homeCurrency)}/day
                        </div>
                      </div>
                      <span className={`btn ${over ? 'btn-danger' : 'btn-green'}`}
                        style={{ padding: '5px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                        {fmt(avg, trip.homeCurrency)}/day
                      </span>
                    </div>
                    <div className="progress-track" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: over ? '#ef4444' : '#1a7a4a' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9a9088' }}>
                        {fmt(total, trip.homeCurrency)} total · {trip.expenses.length} expense{trip.expenses.length !== 1 ? 's' : ''}
                      </span>
                      <button className="btn btn-ghost" style={{ fontSize: 12, color: '#c0392b', padding: '4px 8px' }}
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(trip.id) }}>Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {deleteConfirm && (
        <div className="overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Delete this trip?</div>
              <div style={{ fontSize: 14, color: '#9a9088', marginBottom: 24 }}>All expenses will be permanently removed.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-full" style={{ background: '#f0ede7', color: '#6b6460' }}
                  onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-full" style={{ background: '#ef4444', color: '#fff' }}
                  onClick={() => handleDeleteTrip(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── NEW TRIP ───────────────────────────────────────────────────────────────
  if (view === 'new-trip') return (
    <div className="app-shell">
      <div className="topbar">
        <button className="btn btn-ghost" onClick={() => setView('trips')}>← Back</button>
        <span className="topbar-title">New Trip</span>
        <div style={{ width: 64 }} />
      </div>
      <div className="page">
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div className="empty-icon">🌍</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a1714', marginTop: 8 }}>Plan your adventure</div>
          <div style={{ fontSize: 14, color: '#9a9088', marginTop: 4 }}>All totals will be shown in your home currency.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group animate-in">
            <label className="input-label">Trip name</label>
            <input className="input" placeholder="e.g. Southeast Asia 2025"
              value={tripName} onChange={e => setTripName(e.target.value)} />
          </div>
          <div className="input-group animate-in">
            <label className="input-label">Daily budget</label>
            <input className="input" type="number" min="1" placeholder="e.g. 50"
              value={tripBudget} onChange={e => setTripBudget(e.target.value)} />
          </div>
          <div className="input-group animate-in">
            <label className="input-label">Home currency — all totals shown in this</label>
            <div className="currency-grid">
              {HOME_CURRENCIES.map(c => (
                <button key={c} className={`currency-chip ${homeCurrency === c ? 'active' : ''}`}
                  onClick={() => setHomeCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full btn-lg animate-in" style={{ marginTop: 8 }}
            disabled={!tripName.trim()} onClick={handleCreateTrip}>
            Create Trip →
          </button>
        </div>
      </div>
    </div>
  )

  // ── TRIP DETAIL ────────────────────────────────────────────────────────────
  if ((view === 'detail') && activeTrip) {
    const avg = getAverageDailyHome(activeTrip)
    const over = avg > activeTrip.dailyBudgetHome
    const pct = Math.min((avg / activeTrip.dailyBudgetHome) * 100, 100)
    const days = getTripDays(activeTrip)
    const total = getTotalHome(activeTrip)

    const grouped = [...activeTrip.expenses].reverse().reduce<Record<string, Expense[]>>((acc, e) => {
      (acc[e.date] ??= []).push(e)
      return acc
    }, {})

    // Spend acceleration insight
    const recentAvg = rolling.length >= 3 ? rolling.slice(-3).reduce((s, r) => s + r.avg, 0) / 3 : 0
    const olderAvg = rolling.slice(-7, -3).reduce((s, r) => s + r.avg, 0) / 4
    const acceleration = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
    const topCat = catBreakdown[0]
    const maxCountryTotal = countryBreakdown[0]?.total ?? 1

    return (
      <div className="app-shell">
        <div className="topbar">
          <button className="btn btn-ghost" onClick={() => setView('trips')}>← Trips</button>
          <span className="topbar-title" style={{ fontSize: 16 }}>{activeTrip.name}</span>
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => setView('add')}>+ Add</button>
        </div>
        <div className="page">
          {/* Hero */}
          <div className="trip-hero animate-in" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Total spent</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>{fmt(total, activeTrip.homeCurrency)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>Days tracked</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>{days}</div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.65 }}>Avg/day: <strong>{fmt(avg, activeTrip.homeCurrency)}</strong></span>
                <span style={{ fontSize: 12, opacity: 0.65 }}>Budget: <strong>{fmt(activeTrip.dailyBudgetHome, activeTrip.homeCurrency)}</strong></span>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: over ? '#ff6b6b' : '#4ade80' }} />
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {over
                ? `⚠️ ${fmt(avg - activeTrip.dailyBudgetHome, activeTrip.homeCurrency)} over budget per day`
                : `✅ ${fmt(activeTrip.dailyBudgetHome - avg, activeTrip.homeCurrency)} under budget per day`}
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            <button className={`tab-btn ${detailTab === 'log' ? 'active' : ''}`} onClick={() => setDetailTab('log')}>Expense Log</button>
            <button className={`tab-btn ${detailTab === 'trends' ? 'active' : ''}`} onClick={() => setDetailTab('trends')}>📊 Trends</button>
          </div>

          {/* ── LOG TAB ── */}
          {detailTab === 'log' && (
            activeTrip.expenses.length === 0 ? (
              <div className="empty-state animate-in">
                <div className="empty-icon">💸</div>
                <div className="empty-title">No expenses yet</div>
                <div className="empty-sub" style={{ marginBottom: 20 }}>Log your first expense to start tracking.</div>
                <button className="btn btn-primary" onClick={() => setView('add')}>+ Add expense</button>
              </div>
            ) : (
              <>
                <div className="section-header">{activeTrip.expenses.length} expense{activeTrip.expenses.length !== 1 ? 's' : ''}</div>
                {Object.entries(grouped).map(([date, exps]) => (
                  <div key={date} className="animate-in">
                    <div className="date-badge">{formatDate(date)}</div>
                    <div className="card" style={{ padding: '4px 16px', marginBottom: 10 }}>
                      {exps.map(e => (
                        <div key={e.id} className="expense-row">
                          <div className="expense-icon" style={{ background: CATEGORY_COLORS[e.category] + '22' }}>
                            {CATEGORY_ICONS[e.category]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: '#2d2a26' }}>{CATEGORY_LABELS[e.category]}</span>
                              {e.country !== 'Unknown' && (
                                <span style={{ fontSize: 11, color: '#9a9088' }}>{COUNTRY_FLAGS[e.country] ?? ''} {e.country}</span>
                              )}
                            </div>
                            {e.note && <div style={{ fontSize: 12, color: '#9a9088', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note}</div>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2a26' }}>{fmt(e.amountHome, activeTrip.homeCurrency)}</div>
                            {e.currency !== activeTrip.homeCurrency && (
                              <div style={{ fontSize: 11, color: '#b0a898' }}>{e.amount.toFixed(2)} {e.currency}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )
          )}

          {/* ── TRENDS TAB ── */}
          {detailTab === 'trends' && (
            activeTrip.expenses.length < 2 ? (
              <div className="empty-state animate-in">
                <div className="empty-icon">📊</div>
                <div className="empty-title">Not enough data yet</div>
                <div className="empty-sub">Add a few more expenses to see trends and insights.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* AI insight */}
                {Math.abs(acceleration) > 10 && (
                  <div className="insight-card animate-in">
                    <span className="insight-icon">{acceleration > 0 ? '📈' : '📉'}</span>
                    <div className="insight-text">
                      {acceleration > 0
                        ? <><strong>Spending up {Math.abs(acceleration).toFixed(0)}%</strong> over the past 3 days vs the week before. Your biggest category is <strong>{CATEGORY_LABELS[topCat?.category]}</strong>.</>
                        : <><strong>Spending down {Math.abs(acceleration).toFixed(0)}%</strong> over the past 3 days — nice work keeping costs down!</>}
                    </div>
                  </div>
                )}

                {/* Cumulative spend */}
                <div className="card animate-in">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Cumulative Spend</div>
                  <LineChart series={dailySeries} budget={activeTrip.dailyBudgetHome} currency={activeTrip.homeCurrency} />
                  <div style={{ fontSize: 11, color: '#b0a898', marginTop: 8 }}>
                    Dashed line = budget pace · Blue line = actual spend
                  </div>
                </div>

                {/* Daily bars */}
                <div className="card animate-in">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Daily Spend</div>
                  <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 12 }}>
                    Last {Math.min(dailySeries.length, 30)} days · green = on budget, red = over
                  </div>
                  <DailyBarChart series={dailySeries} budget={activeTrip.dailyBudgetHome} currency={activeTrip.homeCurrency} />
                </div>

                {/* Category donut */}
                {catBreakdown.length > 0 && (
                  <div className="card animate-in">
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Spend by Category</div>
                    <DonutChart data={catBreakdown} currency={activeTrip.homeCurrency} />
                    {/* Category detail rows */}
                    <div style={{ marginTop: 14, borderTop: '1px solid #f0ede7', paddingTop: 10 }}>
                      {catBreakdown.map(d => (
                        <div key={d.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f8f6f3' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[d.category]}</span>
                            <span style={{ fontSize: 13, color: '#2d2a26' }}>{CATEGORY_LABELS[d.category]}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(d.total, activeTrip.homeCurrency)}</span>
                            <span style={{ fontSize: 11, color: '#9a9088', marginLeft: 6 }}>{d.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget pace */}
                <div className="card animate-in">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Budget Pace</div>
                  <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 10 }}>Based on your current daily average</div>
                  <div className="pace-row">
                    <span className="pace-label">Daily average</span>
                    <span className={`pace-value ${pace.onTrack ? 'ok' : 'over'}`}>{fmt(pace.avgPerDay, activeTrip.homeCurrency)}</span>
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">Daily budget</span>
                    <span className="pace-value">{fmt(pace.budget, activeTrip.homeCurrency)}</span>
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">Surplus / deficit per day</span>
                    <span className={`pace-value ${pace.surplusPerDay >= 0 ? 'ok' : 'over'}`}>
                      {pace.surplusPerDay >= 0 ? '+' : ''}{fmt(pace.surplusPerDay, activeTrip.homeCurrency)}
                    </span>
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">Projected 30-day cost</span>
                    <span className="pace-value">{fmt(pace.projectedTotal, activeTrip.homeCurrency)}</span>
                  </div>
                  <div className="pace-row">
                    <span className="pace-label">30-day budget</span>
                    <span className="pace-value">{fmt(pace.budget * 30, activeTrip.homeCurrency)}</span>
                  </div>
                </div>

                {/* Country breakdown */}
                 {countryBreakdown.length > 0 && (
                  <div className="card animate-in">
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Spend by Country</div>
                    <div style={{ fontSize: 12, color: '#9a9088', marginBottom: 14 }}>
                      Backpacker benchmark = typical USD daily spend from crowdsourced data
                    </div>
                    <table className="country-table">
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th>Avg/day</th>
                          <th>Benchmark</th>
                          <th>vs avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {countryBreakdown.map(d => {
                          const benchmark = getBenchmark(d.country)
                          // benchmark is in USD; avgPerDay is in home currency — show a qualitative indicator
                          const hasData = benchmark !== null
                          return (
                            <tr key={d.country}>
                              <td>
                                <div className="country-name-cell">
                                  <span style={{ fontSize: 18 }}>{COUNTRY_FLAGS[d.country] ?? '🌍'}</span>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.country}</div>
                                    <div style={{ fontSize: 11, color: '#9a9088' }}>{d.days} day{d.days !== 1 ? 's' : ''}</div>
                                    <div className="country-bar-bg" style={{ width: 56 }}>
                                      <div className="country-bar-fill" style={{ width: `${(d.total / maxCountryTotal) * 100}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, color: d.avgPerDay > activeTrip.dailyBudgetHome ? '#c0392b' : '#1a7a4a' }}>
                                {fmt(d.avgPerDay, activeTrip.homeCurrency)}
                              </td>
                              <td style={{ color: '#6b6460', fontSize: 12 }}>
                                {hasData ? `$${benchmark}/day` : <span style={{ color: '#b0a898' }}>—</span>}
                              </td>
                              <td>
                                {hasData ? (() => {
                                  // compare avgPerDay in USD vs benchmark
                                  // we stored amountUSD so we can recompute country avg in USD
                                  const usdExpenses = activeTrip.expenses.filter(e => e.country === d.country)
                                  const totalUSD = usdExpenses.reduce((s, e) => s + e.amountUSD, 0)
                                  const avgUSD = totalUSD / d.days
                                  const diff = avgUSD - benchmark!
                                  const pctDiff = Math.round((diff / benchmark!) * 100)
                                  const over = diff > 0
                                  return (
                                    <span style={{
                                      fontSize: 12, fontWeight: 600,
                                      color: over ? '#c0392b' : '#1a7a4a',
                                      background: over ? '#fff0f0' : '#e8f7f0',
                                      padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap'
                                    }}>
                                      {over ? '▲' : '▼'} {Math.abs(pctDiff)}%
                                    </span>
                                  )
                                })() : <span style={{ color: '#b0a898', fontSize: 12 }}>—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div style={{ marginTop: 12, fontSize: 11, color: '#b0a898', borderTop: '1px solid #f0ede7', paddingTop: 8 }}>
                      ▲/▼ vs benchmark is based on your USD equivalent spend. Benchmark = typical backpacker budget.
                    </div>
                  </div>
                )}
 
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  // ── ADD EXPENSE ────────────────────────────────────────────────────────────
  if (view === 'add' && activeTrip) {
    const symMap: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$' }
    const sym = symMap[expenseCurrency] ?? expenseCurrency + ' '

    return (
      <div className="app-shell">
        <div className="topbar">
          <button className="btn btn-ghost" onClick={() => setView('detail')}>← Back</button>
          <span className="topbar-title" style={{ fontSize: 16 }}>Add Expense</span>
          <div style={{ width: 64 }} />
        </div>
        <div className="page">

          {/* Amount input + live conversion preview */}
          <div className="card animate-in" style={{ textAlign: 'center', padding: '20px 20px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: '#c4a87a', fontWeight: 700, lineHeight: 1 }}>{sym}</span>
              <input className="amount-input" type="number" inputMode="decimal" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
            </div>
            {convertedPreview && expenseCurrency !== activeTrip.homeCurrency && (
              <div style={{ fontSize: 13, color: '#9a9088', marginTop: 8, animation: 'slideUp 0.2s ease-out' }}>
                ≈ <strong style={{ color: '#2d2a26' }}>{convertedPreview}</strong> in {activeTrip.homeCurrency}
              </div>
            )}
          </div>

          {/* Country picker — sets currency automatically */}
          <div className="animate-in" style={{ animationDelay: '0.04s', marginBottom: 16 }}>
            <div className="section-header" style={{ margin: '0 0 8px' }}>Country & Currency</div>
            <CountryPicker
              value={expenseCountry}
              onChange={(country, currency) => {
                setExpenseCountry(country)
                setExpenseCurrency(currency)
              }}
            />
            {expenseCountry && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b6460', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{COUNTRY_FLAGS[expenseCountry] ?? '🌍'}</span>
                <span>Entering amount in <strong>{expenseCurrency}</strong></span>
                {expenseCurrency !== activeTrip.homeCurrency && (
                  <span style={{ color: '#9a9088' }}>→ converted to {activeTrip.homeCurrency}</span>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="animate-in" style={{ animationDelay: '0.08s', marginBottom: 16 }}>
            <div className="section-header" style={{ margin: '0 0 8px' }}>Category</div>
            <div className="cat-grid">
              {CATEGORIES.map(cat => (
                <button key={cat} className={`cat-btn ${category === cat ? 'active' : ''}`}
                  style={category === cat ? { background: CATEGORY_COLORS[cat] } : {}}
                  onClick={() => setCategory(cat)}>
                  <span className="emoji">{CATEGORY_ICONS[cat]}</span>
                  {CATEGORY_LABELS[cat].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="animate-in" style={{ animationDelay: '0.12s' }}>
            <div className="input-group">
              <label className="input-label">Note (optional)</label>
              <input className="input" placeholder="e.g. Pad Thai at street market"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg animate-in"
            style={{ marginTop: 20, background: amount && parseFloat(amount) > 0 ? '#2d2a26' : '#c4bdb4', cursor: amount && parseFloat(amount) > 0 ? 'pointer' : 'not-allowed' }}
            disabled={!amount || parseFloat(amount) <= 0 || saving}
            onClick={handleAddExpense}>
            {saving ? 'Converting & saving…' : `Save ${CATEGORY_ICONS[category]} Expense`}
          </button>
        </div>
      </div>
    )
  }

  return null
}