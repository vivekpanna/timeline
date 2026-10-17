export const GROUPS = ['Research', 'Design', 'Engineering', 'Launch'] as const
export type ItemKind = 'task' | 'milestone'

export interface TimelineItem {
  id: string
  title: string
  kind: ItemKind
  group: string
  owner: string
  startDate: string
  endDate: string
  progress: number
}

export interface TimelineProject {
  version: 1
  id: string
  name: string
  startDate: string
  endDate: string
  groups: string[]
  items: TimelineItem[]
  createdAt: string
  updatedAt: string
}

const DAY_MS = 86_400_000

export function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid calendar date.')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date.')
  return date
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS)
}

export function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))
}

export function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function startOfWeek(date: Date) {
  const weekday = (date.getUTCDay() + 6) % 7
  return addDays(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())), -weekday)
}

export function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.round((endUtc - startUtc) / DAY_MS)
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const date = typeof value === 'string' ? getDate(value) : value
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(date)
}

function todayAsDate() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

function timestamp() {
  return new Date().toISOString()
}

export function createBlankProject(name = 'Untitled timeline'): TimelineProject {
  const now = todayAsDate()
  const rangeStart = addMonths(startOfMonth(now), -1)
  const rangeEnd = addMonths(startOfMonth(now), 5)
  const createdAt = timestamp()
  return {
    version: 1,
    id: createId(),
    name,
    startDate: rangeStart.toISOString().slice(0, 10),
    endDate: rangeEnd.toISOString().slice(0, 10),
    groups: [...GROUPS],
    items: [],
    createdAt,
    updatedAt: createdAt,
  }
}

export function createSampleProject(): TimelineProject {
  const now = todayAsDate()
  const month = startOfMonth(now)
  const start = addMonths(month, -1)
  const end = addMonths(month, 5)
  const at = (offset: number) => addDays(month, offset).toISOString().slice(0, 10)
  const items: Omit<TimelineItem, 'id'>[] = [
    { title: 'Customer interviews', kind: 'task', group: 'Research', owner: 'Jordan Lee', startDate: at(-17), endDate: at(-7), progress: 100 },
    { title: 'Product direction', kind: 'task', group: 'Research', owner: 'Maya K.', startDate: at(-8), endDate: at(11), progress: 100 },
    { title: 'Experience prototype', kind: 'task', group: 'Design', owner: 'Maya K.', startDate: at(4), endDate: at(27), progress: 72 },
    { title: 'Build the core', kind: 'task', group: 'Engineering', owner: 'Alex Chen', startDate: at(20), endDate: at(68), progress: 43 },
    { title: 'Private beta', kind: 'task', group: 'Launch', owner: 'Jordan Lee', startDate: at(54), endDate: at(82), progress: 18 },
    { title: 'Release readiness', kind: 'milestone', group: 'Launch', owner: 'Team', startDate: at(85), endDate: at(85), progress: 0 },
    { title: 'Public launch', kind: 'milestone', group: 'Launch', owner: 'Team', startDate: at(106), endDate: at(106), progress: 0 },
  ]
  const createdAt = timestamp()
  return {
    version: 1,
    id: createId(),
    name: 'Product launch plan',
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    groups: [...GROUPS],
    items: items.map((item) => ({ ...item, id: createId() })),
    createdAt,
    updatedAt: createdAt,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try { getDate(value); return true } catch { return false }
}

export function parseImportedProject(value: unknown): TimelineProject {
  if (!isRecord(value) || value.version !== 1 || typeof value.id !== 'string' || typeof value.name !== 'string') {
    throw new Error('This file is not a supported Daymark project file.')
  }
  if (!isDate(value.startDate) || !isDate(value.endDate) || value.startDate > value.endDate) {
    throw new Error('The project has an invalid date range.')
  }
  if (!Array.isArray(value.items) || !Array.isArray(value.groups)) {
    throw new Error('The project is missing its tasks or workstreams.')
  }
  const items = value.items.map((entry): TimelineItem => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.title !== 'string' || !entry.title.trim()) {
      throw new Error('A timeline item is missing its identity or name.')
    }
    if (entry.kind !== 'task' && entry.kind !== 'milestone') throw new Error('An item has an unsupported type.')
    if (typeof entry.group !== 'string' || typeof entry.owner !== 'string') throw new Error('An item has invalid workstream or owner data.')
    if (!isDate(entry.startDate) || !isDate(entry.endDate) || entry.startDate > entry.endDate) throw new Error('An item has an invalid date range.')
    if (typeof entry.progress !== 'number' || !Number.isInteger(entry.progress) || entry.progress < 0 || entry.progress > 100) throw new Error('Progress must be a whole number from 0 to 100.')
    if (entry.kind === 'milestone' && (entry.startDate !== entry.endDate || entry.progress !== 0)) throw new Error('Milestones must have one date and no progress value.')
    return { id: entry.id, title: entry.title, kind: entry.kind, group: entry.group, owner: entry.owner, startDate: entry.startDate, endDate: entry.endDate, progress: entry.progress }
  })
  const groups = value.groups.filter((group): group is string => typeof group === 'string' && group.trim().length > 0)
  if (groups.length !== value.groups.length) throw new Error('A workstream name is invalid.')
  return {
    version: 1,
    id: value.id,
    name: value.name.trim() || 'Imported timeline',
    startDate: value.startDate,
    endDate: value.endDate,
    groups: [...new Set(groups)],
    items,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : timestamp(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : timestamp(),
  }
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(project: TimelineProject) {
  const rows = [
    ['Name', 'Type', 'Workstream', 'Owner', 'Start date', 'End date', 'Progress'],
    ...project.items.map((item) => [item.title, item.kind, item.group, item.owner, item.startDate, item.endDate, item.progress]),
  ]
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
}

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

export function buildTimelineSvg(project: TimelineProject) {
  const width = 1440
  const left = 320
  const right = 48
  const top = 132
  const rowHeight = 72
  const height = top + project.items.length * rowHeight + 56
  const start = getDate(project.startDate)
  const end = addDays(getDate(project.endDate), 1)
  const total = Math.max(1, daysBetween(start, end))
  const plotWidth = width - left - right
  const items = [...project.items].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const ticks: string[] = []
  for (let cursor = startOfMonth(start); cursor < end; cursor = addMonths(cursor, 1)) {
    const x = left + (daysBetween(start, cursor) / total) * plotWidth
    ticks.push(`<line x1="${x}" y1="96" x2="${x}" y2="${height - 24}" stroke="#e5e9e5"/><text x="${x + 8}" y="112" fill="#52635e" font-size="13">${escapeXml(formatDate(cursor, { month: 'short', year: 'numeric' }))}</text>`)
  }
  const rows = items.map((item, index) => {
    const y = top + index * rowHeight
    const x = left + (daysBetween(start, getDate(item.startDate)) / total) * plotWidth
    const duration = Math.max(1, daysBetween(getDate(item.startDate), addDays(getDate(item.endDate), 1)))
    const barWidth = Math.max(item.kind === 'milestone' ? 0 : 12, (duration / total) * plotWidth)
    const color = ({ Research: '#5f947b', Design: '#5487a4', Engineering: '#c79339', Launch: '#ce765f' } as Record<string, string>)[item.group] ?? '#688c83'
    const mark = item.kind === 'milestone'
      ? `<path d="M ${x} ${y + 20} l 9 9 -9 9 -9 -9 Z" fill="${color}"/>`
      : `<rect x="${x}" y="${y + 17}" width="${barWidth}" height="24" rx="6" fill="${color}"/><rect x="${x}" y="${y + 17}" width="${barWidth * item.progress / 100}" height="24" rx="6" fill="#173f35" fill-opacity=".34"/>`
    return `<text x="32" y="${y + 32}" fill="#20302a" font-size="15" font-weight="600">${escapeXml(item.title)}</text><text x="32" y="${y + 51}" fill="#73817b" font-size="11">${escapeXml(item.group)} · ${escapeXml(item.owner || 'Unassigned')}</text>${mark}`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fbfcf9"/><text x="32" y="52" fill="#20302a" font-family="Arial,sans-serif" font-size="28" font-weight="700">${escapeXml(project.name)}</text><text x="32" y="76" fill="#73817b" font-family="Arial,sans-serif" font-size="12">PROJECT TIMELINE · ${escapeXml(formatDate(project.startDate, { month: 'short', day: 'numeric', year: 'numeric' }))} — ${escapeXml(formatDate(project.endDate, { month: 'short', day: 'numeric', year: 'numeric' }))}</text>${ticks.join('')}${rows.join('')}</svg>`
}