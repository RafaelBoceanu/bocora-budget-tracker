// src/lib.countryData.ts
import { useState, useEffect } from 'react';

export interface CountryInfo {
    name: string;
    flag: string;
    currency: string;
    budget: number;
}

export const BUDGET_BY_COUNTRY: Record<string, number> = {
  // Southeast Asia
  Thailand: 35, Vietnam: 30, Indonesia: 35, Cambodia: 30, Laos: 25,
  Myanmar: 30, Philippines: 35, Malaysia: 45, Singapore: 90,
  // South Asia
  India: 25, Nepal: 25, 'Sri Lanka': 40, Maldives: 150,
  // East Asia
  Japan: 80, 'South Korea': 60, Taiwan: 50, China: 55,
  // Europe — Western
  Portugal: 65, Spain: 70, Italy: 80, Greece: 60, Germany: 75,
  France: 85, Netherlands: 80, Austria: 75, Belgium: 75, Ireland: 90,
  Switzerland: 130, Norway: 120, Sweden: 100, Denmark: 110, Finland: 95,
  Iceland: 140, 'United Kingdom': 90,
  // Europe — Eastern/Balkan
  'Czech Republic': 55, Hungary: 50, Poland: 50, Croatia: 65, Romania: 40,
  Bulgaria: 35, Serbia: 35, Albania: 30, 'North Macedonia': 30,
  Montenegro: 45, 'Bosnia and Herzegovina': 35,
  // Middle East / Caucasus
  Turkey: 40, Israel: 90, Jordan: 55, 'United Arab Emirates': 100,
  Georgia: 35, Armenia: 35, Azerbaijan: 40,
  // Americas
  Mexico: 45, Colombia: 40, Peru: 40, Bolivia: 30, Argentina: 45,
  Brazil: 50, Chile: 55, Ecuador: 35, Paraguay: 30, Uruguay: 55,
  'Costa Rica': 55, Guatemala: 35, Panama: 55, Cuba: 50,
  'Dominican Republic': 60, 'United States': 100, Canada: 95,
  // Africa
  Morocco: 40, Egypt: 30, Tunisia: 35, Algeria: 40, Kenya: 40,
  Tanzania: 45, Ethiopia: 25, Rwanda: 40, Uganda: 35,
  'South Africa': 50, Botswana: 55, Namibia: 50, Zambia: 45,
  Zimbabwe: 40, Mozambique: 35, Ghana: 40, Nigeria: 45, Senegal: 35,
  "Côte d'Ivoire": 40, Liberia: 35, 'Sierra Leone': 30, Cameroon: 40,
  Gabon: 55, Mauritius: 80, Madagascar: 30, Angola: 55,
  // Oceania
  Australia: 90, 'New Zealand': 85, Fiji: 70, Vanuatu: 75,
  Samoa: 65, 'Papua New Guinea': 60, 'Solomon Islands': 55,
}

interface RestCountry {
    name: { common: string }
    flag: string
    currencies?: Record< string, { name: string, symbol: string }>
    independent?: boolean
    unMember?: boolean
}

const NAME_ALIASES: Record<string, string> = {
  'South Korea':           'Korea, Republic of',
  'Czech Republic':        'Czechia',
  'United Kingdom':        'United Kingdom',
  'United States':         'United States',
  'Bolivia':               'Bolivia',
  "Côte d'Ivoire":         'Côte d\'Ivoire',
  'Democratic Republic of the Congo': 'DR Congo',
  'Republic of the Congo': 'Congo',
  'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
  'North Macedonia':       'North Macedonia',
  'Sri Lanka':             'Sri Lanka',
  'New Zealand':           'New Zealand',
  'South Africa':          'South Africa',
  'Papua New Guinea':      'Papua New Guinea',
  'Solomon Islands':       'Solomon Islands',
  'Sierra Leone':          'Sierra Leone',
  'Dominican Republic':    'Dominican Republic',
  'Costa Rica':            'Costa Rica',
  'United Arab Emirates':  'United Arab Emirates',
}

const PREFFERRED_CURRENCY: Record<string, string> = {
    Cambodia: 'USD',
    Ecuador:  'USD',
    Panama:   'USD',
    Zimbabwe: 'USD',
    Cuba:     'CUP',
}

let cachedCountries: CountryInfo[] | null = null

async function fetchCountries(): Promise<CountryInfo[]> {
    if (cachedCountries) return cachedCountries

    const res = await fetch(
        'https://restcountries.com/v3.1/all?fields=name,flags,currencies,independent,unMember',
        { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) throw new Error(`REST Countries API error: ${res.status}`)
    const raw: RestCountry[] = await res.json()

    const countries: CountryInfo[] = raw
        .filter(c => c.currencies && Object.keys(c.currencies).length > 0)
        .map(c => {
          const name = c.name.common
          const flag = c.flag ?? '🌍'
          const currencyCodes = Object.keys(c.currencies!)
          const currency = PREFFERRED_CURRENCY[name] ?? currencyCodes[0]
          const budget = BUDGET_BY_COUNTRY[name] ?? null
          return { name, flag, currency, budget }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    
    cachedCountries = countries
    return countries
}

export function useCountryData() {
    const [countries, setCountries] = useState<CountryInfo[]>([])
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchCountries()
          .then(data => { setCountries(data); setLoaded(true) })
          .catch(err => { 
            console.warn('Failed to load country data from API, using fallback', err)
            setError(err.message)
            const fallback: CountryInfo[] = Object.entries(BUDGET_BY_COUNTRY).map(([name, budget]) => ({
                name,
                flag: '🌍',
                currency: 'USD',
                budget,
            })).sort((a, b) => a.name.localeCompare(b.name))
            setCountries(fallback)
            setLoaded(true)
        })
    }, [])

    return { countries, loaded, error }
}

export function getBudgetForCountry(countries: CountryInfo[], name: string): number | null {
    return countries.find(c => c.name === name)?.budget ?? null
}