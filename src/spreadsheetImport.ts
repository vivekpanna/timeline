import { addDays, createId, getDate, type TimelineItem, type TimelineProject } from './timeline'

interface ImportCell {
  value: unknown
  display?: string
  numberFormat?: string
}

type ImportField = 'title' | 'kind' | 'group' | 'owner' | 'startDate' | 'endDate' | 'duration' | 'progress'

const DAY_MS = 86_400_000

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9%]/g, '')
}

function fieldForHeader(value: string): ImportField | undefined {
  const header = normalizeHeader(value)
  if (['name', 'task', 'taskname', 'title', 'item', 'activity'].includes(header)) return 'title'
  if (['type', 'kind', 'milestone'].includes(header)) return 'kind'
  if (['workstream', 'group', 'swimlane', 'lane', 'category'].includes(header)) return 'group'
  if (['owner', 'assignee', 'responsible', 'lead'].includes(header)) return 'owner'
  if (['start', 'startdate', 'begin', 'begindate'].includes(header)) return 'startDate'
  if (['end', 'enddate', 'finish', 'finishdate', 'due', 'duedate'].includes(header)) return 'endDate'
  if (['duration', 'days'].includes(header)) return 'duration'
  if (['progress', 'percent', 'percentcomplete', 'completion', 'complete', '%complete'].includes(header)) return 'progress'
  return undefined
}

function displayValue(cell: ImportCell) {
  const value = cell.value
  if (value === null || value === undefined) return cell.display?.trim() ?? ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    if ('result' in value) return displayValue({ value: value.result, display: cell.display, numberFormat: cell.numberFormat })
    if ('richText' in value && Array.isArray(value.richText)) return value.richText.map((part) => 'text' in part ? part.text : '').join('')
    if ('text' in value && typeof value.text === 'string') return value.text
    return cell.display?.trim() ?? ''
  }
  return String(value).trim()
}

function parseDateCell(cell: ImportCell, date1904: boolean) {
  const value = cell.value
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && Number.isFinite(value)) {
    const days = Math.floor(value)
    const epoch = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 31)
    const correctedDays = !date1904 && days >= 60 ? days - 1 : days
    const date = new Date(epoch + correctedDays * DAY_MS)
    const result = date.toISOString().slice(0, 10)
    getDate(result)
    return result
  }

  const text = displayValue(cell)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    getDate(text)
    return text
  }
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text)
  if (match) {
    const first = Number(match[1])
    const second = Number(match[2])
    const month = first > 12 ? second : first
    const day = first > 12 ? first : second
    const result = `${match[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    getDate(result)
    return result
  }
  throw new Error(`Invalid date "${text}". Use YYYY-MM-DD or MM/DD/YYYY.`)
}

function parseProgress(cell: ImportCell, excelPercentages: boolean) {
  const value = cell.value
  const display = cell.display?.trim() ?? ''
  const shownAsPercent = display.endsWith('%')
  const text = shownAsPercent ? display.slice(0, -1).trim() : displayValue(cell).replace(/%$/, '').trim()
  const fraction = excelPercentages && typeof value === 'number' && value >= 0 && value <= 1 && !shownAsPercent
  const parsed = typeof value === 'number' && !shownAsPercent
    ? value * (cell.numberFormat?.includes('%') || fraction ? 100 : 1)
    : Number(text)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Invalid progress "${displayValue(cell)}". Use a whole number from 0 to 100.`)
  }
  return parsed
}

function isTruthy(value: string) {
  return ['true', 'yes', 'y', '1', 'milestone', 'key date'].includes(value.trim().toLowerCase())
}

function parseRows(rows: ImportCell[][], fileName: string, date1904 = false, excelPercentages = false): TimelineProject {
  const headerIndex = rows.slice(0, 25).findIndex((row) => {
    const fields = row.map((cell) => fieldForHeader(displayValue(cell)))
    return fields.includes('title') && (fields.includes('startDate') || fields.includes('endDate'))
  })
  if (headerIndex < 0) throw new Error('Could not find task name and date columns. Use the downloaded CSV headers or add Task Name and Start Date columns.')

  const header = rows[headerIndex].map((cell) => fieldForHeader(displayValue(cell)))
  const entries = rows.slice(headerIndex + 1)
  const items: TimelineItem[] = []
  const rowErrors: string[] = []

  entries.forEach((row, index) => {
    if (row.every((cell) => displayValue(cell) === '')) return
    const values = new Map<ImportField, ImportCell>()
    header.forEach((field, columnIndex) => {
      if (field && row[columnIndex]) values.set(field, row[columnIndex])
    })

    try {
      const title = displayValue(values.get('title') ?? { value: '' }).trim()
      if (!title) throw new Error('Task name is required.')

      const typeText = displayValue(values.get('kind') ?? { value: '' })
      const milestone = typeText.trim().toLowerCase() === 'milestone' || isTruthy(typeText)
      const kind: TimelineItem['kind'] = milestone ? 'milestone' : 'task'
      const startCell = values.get('startDate')
      const endCell = values.get('endDate')
      if (!startCell && !endCell) throw new Error('Start date is required.')
      const startDate = startCell ? parseDateCell(startCell, date1904) : parseDateCell(endCell!, date1904)
      let endDate = endCell ? parseDateCell(endCell, date1904) : startDate
      if (kind === 'task' && !endCell && values.has('duration')) {
        const duration = Number(displayValue(values.get('duration')!))
        if (!Number.isInteger(duration) || duration < 1) throw new Error('Duration must be a positive whole number of days.')
        endDate = addDays(getDate(startDate), duration - 1).toISOString().slice(0, 10)
      }
      const normalizedStart = kind === 'milestone' && !startCell ? endDate : startDate
      const normalizedEnd = kind === 'milestone' ? normalizedStart : endDate
      if (normalizedStart > normalizedEnd) throw new Error('End date must be on or after start date.')

      const group = displayValue(values.get('group') ?? { value: '' }).trim() || 'General'
      const owner = displayValue(values.get('owner') ?? { value: '' }).trim()
      const progressCell = values.get('progress')
      const progress = kind === 'milestone' ? 0 : progressCell && displayValue(progressCell) !== '' ? parseProgress(progressCell, excelPercentages) : 0
      items.push({ id: createId(), title, kind, group, owner, startDate: normalizedStart, endDate: normalizedEnd, progress })
    } catch (error) {
      rowErrors.push(`Row ${headerIndex + index + 2}: ${error instanceof Error ? error.message : 'Invalid row.'}`)
    }
  })

  if (rowErrors.length > 0) throw new Error(`Fix these spreadsheet rows before importing:\n${rowErrors.slice(0, 8).join('\n')}${rowErrors.length > 8 ? `\n…and ${rowErrors.length - 8} more` : ''}`)
  if (items.length === 0) throw new Error('No timeline rows found below the header row.')

  const startDate = items.reduce((earliest, item) => item.startDate < earliest ? item.startDate : earliest, items[0].startDate)
  const endDate = items.reduce((latest, item) => item.endDate > latest ? item.endDate : latest, items[0].endDate)
  const groups = [...new Set(items.map((item) => item.group))]
  const name = fileName.replace(/\.(csv|xlsx|xlsm)$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported timeline'
  const createdAt = new Date().toISOString()

  return { version: 1, id: createId(), name, design: 'classic', startDate, endDate, groups, items, createdAt, updatedAt: createdAt }
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  let quoted = false
  let commaCount = 0
  let semicolonCount = 0
  let tabCount = 0
  for (let index = 0; index < firstLine.length; index += 1) {
    const character = firstLine[index]
    if (character === '"') {
      if (quoted && firstLine[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && character === ',') commaCount += 1
    else if (!quoted && character === ';') semicolonCount += 1
    else if (!quoted && character === '\t') tabCount += 1
  }
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t'
  if (semicolonCount > commaCount) return ';'
  return ','
}

function parseCsv(text: string): ImportCell[][] {
  const source = text.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(source)
  const rows: ImportCell[][] = []
  let row: ImportCell[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === delimiter) {
      row.push({ value })
      value = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      row.push({ value })
      if (row.some((cell) => displayValue(cell) !== '')) rows.push(row)
      row = []
      value = ''
    } else {
      value += character
    }
  }

  if (quoted) throw new Error('The CSV has an unclosed quoted value.')
  if (value || row.length > 0) {
    row.push({ value })
    if (row.some((cell) => displayValue(cell) !== '')) rows.push(row)
  }
  return rows
}

export function parseCsvProject(text: string, fileName: string) {
  return parseRows(parseCsv(text), fileName)
}

export async function parseExcelProject(file: File) {
  const { readSheet } = await import('read-excel-file/browser')
  const data = await readSheet(file)
  const rows = data.map((row) => row.map((value) => ({
    value,
    display: value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? ''),
  })))
  return parseRows(rows, file.name, false, true)
}