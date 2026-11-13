import type { AppData, Client, Order, OrderChannel, OrderStatus, Product, ProductCategory, Promotion, Task } from './types'

export const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`

export const initials = (name: string) => name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0]?.toLocaleUpperCase('ru-RU') ?? '')
  .join('')

export const time = (iso: string) => new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(iso))

export const dayLabel = (date: Date) => new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
}).format(date).replace('.', '')

export function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser time to start the download before revoking its object URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_500)
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: string | number) => {
    const raw = String(value)
    // Prevent spreadsheet formula injection when a user-controlled value starts with a formula character.
    const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw
    return `"${safe.replaceAll('"', '""')}"`
  }
  return `\uFEFF${headers.map(escape).join(';')}\r\n${rows.map((row) => headers.map((key) => escape(row[key] ?? '')).join(';')).join('\r\n')}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim().length > 0
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const ORDER_STATUSES: OrderStatus[] = ['Новый', 'Готовится', 'Готов', 'Доставлен', 'Отменён']
const ORDER_CHANNELS: OrderChannel[] = ['Самовывоз', 'Доставка', 'В зале']
const PRODUCT_CATEGORIES: ProductCategory[] = ['Бургеры', 'Закуски', 'Напитки', 'Десерты']

function isOrder(value: unknown): value is Order {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.id)
    && isString(value.clientId)
    && isNonEmptyString(value.clientName)
    && isString(value.phone)
    && isString(value.items)
    && isFiniteNumber(value.total)
    && value.total >= 0
    && ORDER_STATUSES.includes(value.status as OrderStatus)
    && ORDER_CHANNELS.includes(value.channel as OrderChannel)
    && isString(value.createdAt)
    && Number.isFinite(Date.parse(value.createdAt))
}

function isClient(value: unknown): value is Client {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.name)
    && isString(value.phone)
    && isString(value.email)
    && isFiniteNumber(value.orders)
    && value.orders >= 0
    && isFiniteNumber(value.spent)
    && value.spent >= 0
    && isString(value.lastOrder)
    && isString(value.note)
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.name)
    && PRODUCT_CATEGORIES.includes(value.category as ProductCategory)
    && isFiniteNumber(value.price)
    && value.price > 0
    && isString(value.description)
    && isString(value.emoji)
    && typeof value.available === 'boolean'
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.title)
    && isString(value.description)
    && isString(value.time)
    && typeof value.done === 'boolean'
}

function isPromotion(value: unknown): value is Promotion {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.title)
    && isString(value.description)
    && isFiniteNumber(value.discount)
    && value.discount >= 0
    && value.discount <= 100
    && typeof value.enabled === 'boolean'
    && isString(value.audience)
}

export function isAppData(value: unknown): value is AppData {
  if (!isRecord(value)) return false
  return Array.isArray(value.orders) && value.orders.every(isOrder)
    && Array.isArray(value.clients) && value.clients.every(isClient)
    && Array.isArray(value.products) && value.products.every(isProduct)
    && Array.isArray(value.tasks) && value.tasks.every(isTask)
    && Array.isArray(value.promotions) && value.promotions.every(isPromotion)
}

export function safeRead<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    return !validate || validate(parsed) ? parsed as T : fallback
  } catch {
    return fallback
  }
}

export function safeWrite(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Private browsing, storage quotas, or browser policy can disable localStorage.
    return false
  }
}
