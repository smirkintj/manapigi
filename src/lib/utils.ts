export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  return `${day}-${month}-${year}`
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  MYR: 'RM',
  JPY: '¥',
  USD: '$',
  EUR: '€',
  SGD: 'S$',
  IDR: 'Rp',
  THB: '฿',
  AUD: 'A$',
  GBP: '£',
  CNY: 'CN¥',
  KRW: '₩',
  TWD: 'NT$',
  HKD: 'HK$',
}

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS)

const NO_DECIMAL = new Set(['JPY', 'KRW', 'IDR'])

export function formatAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency
  if (NO_DECIMAL.has(currency)) {
    return `${sym}${Math.round(amount).toLocaleString()}`
  }
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const TRANSPORT_MODES = [
  { value: 'flight', label: 'Flight', icon: '✈️' },
  { value: 'train', label: 'Train', icon: '🚃' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'driving', label: 'Car', icon: '🚗' },
  { value: 'ferry', label: 'Ferry', icon: '⛴️' },
  { value: 'walking', label: 'Walk', icon: '🚶' },
] as const

export type TransportMode = (typeof TRANSPORT_MODES)[number]['value']

export function transportIcon(mode: string | null): string {
  return TRANSPORT_MODES.find((m) => m.value === mode)?.icon ?? '→'
}
