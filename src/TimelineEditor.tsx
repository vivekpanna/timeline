import { useEffect, useRef, useState, type ClipboardEvent, type CSSProperties, type FormEvent } from 'react'
import {
  AlignLeft,
  ArrowDownToLine,
  CalendarDays,
  ChartGantt,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileJson,
  FileSpreadsheet,
  Flag,
  FolderPlus,
  LockKeyhole,
  Palette,
  Pencil,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  addDays,
  addMonths,
  buildCsv,
  buildCsvTemplate,
  buildTimelineSvg,
  createBlankProject,
  createId,
  createProjectFromTemplate,
  createSampleProject,
  daysBetween,
  formatDate,
  getDate,
  getTimelineGroupColors,
  getProjectDateRange,
  GROUPS,
  GALLERY_TEMPLATES,
  isoWeekNumber,
  parseImportedProject,
  startOfMonth,
  startOfWeek,
  TEMPLATE_CATEGORIES,
  TIMELINE_DESIGNS,
  type TimelineItem,
  type TimelineDesign,
  type TemplateCategory,
  type TimelineProject,
  type TimelineTemplate,
  type TimelineTemplateId,
} from './timeline'
import './TimelineEditor.css'

const STORAGE_KEY = 'daymark.projects.v1'
const ACTIVE_KEY = 'daymark.active-project.v1'
type Scale = 'month' | 'week'
type ViewMode = 'timeline' | 'gantt' | 'data'
type ItemDraft = Omit<TimelineItem, 'id'>
type GridField = 'title' | 'kind' | 'group' | 'owner' | 'startDate' | 'endDate' | 'progress'

const GRID_FIELDS: GridField[] = ['title', 'kind', 'group', 'owner', 'startDate', 'endDate', 'progress']

function gridFieldFromHeader(value: string): GridField | undefined {
  const header = value.trim().toLowerCase().replace(/[^a-z%]/g, '')
  if (['task', 'taskname', 'name', 'title', 'item'].includes(header)) return 'title'
  if (['type', 'kind'].includes(header)) return 'kind'
  if (['workstream', 'group', 'category', 'lane'].includes(header)) return 'group'
  if (['owner', 'assignee', 'lead'].includes(header)) return 'owner'
  if (['start', 'startdate', 'startday'].includes(header)) return 'startDate'
  if (['end', 'enddate', 'duedate', 'finish'].includes(header)) return 'endDate'
  if (['progress', 'complete', 'completion', 'percentcomplete', '%complete'].includes(header)) return 'progress'
  return undefined
}

function parseGridDate(value: string) {
  const text = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    getDate(text)
    return text
  }
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text)
  if (!match) throw new Error(`Use YYYY-MM-DD or MM/DD/YYYY for dates: ${text}`)
  const first = Number(match[1])
  const second = Number(match[2])
  const month = first > 12 ? second : first
  const day = first > 12 ? first : second
  const date = `${match[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  getDate(date)
  return date
}

function loadProjects(): TimelineProject[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        const projects = parsed.flatMap((value) => {
          try { return [parseImportedProject(value)] } catch { return [] }
        })
        if (projects.length > 0) return projects
      }
    }
  } catch {
    // Recover to the sample if local storage is unavailable or malformed.
  }
  return [createSampleProject()]
}

function saveBlob(filename: string, contents: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function getRange(project: TimelineProject, scale: Scale) {
  const projectRange = getProjectDateRange(project)
  const earliest = getDate(projectRange.startDate)
  const latest = getDate(projectRange.endDate)
  const start = scale === 'week' ? startOfWeek(earliest) : startOfMonth(earliest)
  const last = scale === 'week' ? startOfWeek(latest) : startOfMonth(latest)
  const end = scale === 'week' ? addDays(last, 7) : addMonths(last, 1)
  const periods: { start: Date; label: string; sublabel: string }[] = []
  for (let cursor = new Date(start); cursor < end; cursor = scale === 'week' ? addDays(cursor, 7) : addMonths(cursor, 1)) {
    periods.push({
      start: new Date(cursor),
      label: formatDate(cursor, scale === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short' }),
      sublabel: scale === 'week' ? `W${String(isoWeekNumber(cursor)).padStart(2, '0')}` : String(cursor.getUTCFullYear()),
    })
  }
  return { start, end, periods, totalDays: daysBetween(start, end) }
}

function makeDraft(project: TimelineProject, kind: TimelineItem['kind']): ItemDraft {
  const today = new Date()
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10)
  const end = addDays(getDate(start), kind === 'milestone' ? 0 : 7).toISOString().slice(0, 10)
  return {
    title: kind === 'milestone' ? 'New milestone' : 'New task',
    kind,
    group: project.groups[0] ?? GROUPS[0],
    owner: '',
    startDate: start,
    endDate: end,
    progress: 0,
  }
}

function SpreadsheetRow({
  item,
  rowIndex,
  groups,
  onCommit,
  onDetails,
}: {
  item: TimelineItem
  rowIndex: number
  groups: string[]
  onCommit: (item: TimelineItem) => void
  onDetails: () => void
}) {
  const [draft, setDraft] = useState<Partial<TimelineItem>>({})
  const [error, setError] = useState('')
  const current = { ...item, ...draft }

  function edit<K extends GridField>(field: K, value: TimelineItem[K]) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setError('')
  }

  function commit() {
    if (Object.keys(draft).length === 0) return
    const next = { ...item, ...draft }
    if (!next.title.trim()) return setError('A task name is required.')
    if (next.kind === 'milestone') {
      next.endDate = next.startDate
      next.progress = 0
    }
    try {
      getDate(next.startDate)
      getDate(next.endDate)
    } catch {
      return setError('Enter valid calendar dates.')
    }
    if (next.startDate > next.endDate) return setError('End date must be on or after start date.')
    if (!Number.isInteger(next.progress) || next.progress < 0 || next.progress > 100) return setError('Progress must be from 0 to 100.')
    onCommit({ ...next, title: next.title.trim() })
    setDraft({})
    setError('')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft({})
      setError('')
      event.currentTarget.blur()
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
      const column = event.currentTarget.dataset.gridCol
      const next = event.currentTarget.closest('tr')?.nextElementSibling?.querySelector<HTMLElement>(`[data-grid-col="${column}"]`)
      next?.focus()
    }
  }

  const cellProps = (field: GridField) => ({
    'data-grid-row': rowIndex,
    'data-grid-col': GRID_FIELDS.indexOf(field),
    onBlur: commit,
    onKeyDown: handleKeyDown,
    'aria-invalid': Boolean(error),
  })

  return <tr className={error ? 'spreadsheet-row has-error' : 'spreadsheet-row'}>
    <td><input {...cellProps('title')} aria-label={`Task name, row ${rowIndex + 1}`} value={current.title} onChange={(event) => edit('title', event.target.value)} /></td>
    <td><select {...cellProps('kind')} aria-label={`Type, row ${rowIndex + 1}`} value={current.kind} onChange={(event) => {
      const kind = event.target.value as TimelineItem['kind']
      setDraft((previous) => ({ ...previous, kind, ...(kind === 'milestone' ? { endDate: current.startDate, progress: 0 } : {}) }))
      setError('')
    }}><option value="task">Task</option><option value="milestone">Milestone</option></select></td>
    <td><input {...cellProps('group')} aria-label={`Workstream, row ${rowIndex + 1}`} list="spreadsheet-workstreams" value={current.group} onChange={(event) => edit('group', event.target.value)} /><datalist id="spreadsheet-workstreams">{groups.map((group) => <option key={group} value={group} />)}</datalist></td>
    <td><input {...cellProps('owner')} aria-label={`Owner, row ${rowIndex + 1}`} value={current.owner} onChange={(event) => edit('owner', event.target.value)} /></td>
    <td><input {...cellProps('startDate')} type="date" aria-label={`Start date, row ${rowIndex + 1}`} value={current.startDate} onChange={(event) => edit('startDate', event.target.value)} /></td>
    <td><input {...cellProps('endDate')} type="date" aria-label={`End date, row ${rowIndex + 1}`} value={current.endDate} disabled={current.kind === 'milestone'} onChange={(event) => edit('endDate', event.target.value)} /></td>
    <td><div className="progress-cell"><input {...cellProps('progress')} type="number" min="0" max="100" step="1" aria-label={`Progress percent, row ${rowIndex + 1}`} value={current.progress} disabled={current.kind === 'milestone'} onChange={(event) => edit('progress', Number(event.target.value))} /><span>%</span></div></td>
    <td><button className="icon-button quiet spreadsheet-detail" type="button" aria-label={`Open details for ${item.title}`} title="More details" onClick={onDetails}><Pencil size={14} /></button>{error && <span className="spreadsheet-error" role="alert">{error}</span>}</td>
  </tr>
}

function SpreadsheetGrid({
  items,
  groups,
  message,
  onCommit,
  onPaste,
  onAdd,
  onDetails,
}: {
  items: TimelineItem[]
  groups: string[]
  message: string
  onCommit: (item: TimelineItem) => void
  onPaste: (event: ClipboardEvent<HTMLDivElement>, rowIndex: number, columnIndex: number) => void
  onAdd: () => void
  onDetails: (item: TimelineItem) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const focusLastRow = useRef(false)

  useEffect(() => {
    if (!focusLastRow.current) return
    gridRef.current?.querySelector<HTMLInputElement>(`[data-grid-row="${items.length - 1}"][data-grid-col="0"]`)?.focus()
    focusLastRow.current = false
  }, [items.length])

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return
    const rowIndex = Number(target.dataset.gridRow)
    const columnIndex = Number(target.dataset.gridCol)
    if (Number.isInteger(rowIndex) && Number.isInteger(columnIndex)) onPaste(event, rowIndex, columnIndex)
  }

  function addRow() {
    focusLastRow.current = true
    onAdd()
  }

  return <div className="spreadsheet-area">
    <div className="spreadsheet-scroll" ref={gridRef} onPaste={handlePaste}>
      <table className="spreadsheet-table">
        <thead><tr><th>Task name</th><th>Type</th><th>Workstream</th><th>Owner</th><th>Start date</th><th>End date</th><th>Progress</th><th aria-label="Row actions" /></tr></thead>
        <tbody>{items.map((item, rowIndex) => <SpreadsheetRow key={item.id} item={item} rowIndex={rowIndex} groups={groups} onCommit={onCommit} onDetails={() => onDetails(item)} />)}</tbody>
      </table>
    </div>
    <div className="spreadsheet-footer"><button className="spreadsheet-add" type="button" onClick={addRow}><Plus size={15} /> Add row</button><span role="status">{message || `${items.length} rows`}</span></div>
  </div>
}

function ItemEditor({
  item,
  groups,
  onClose,
  onSave,
  onDelete,
}: {
  item: TimelineItem | ItemDraft
  groups: string[]
  onClose: () => void
  onSave: (item: TimelineItem) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(item.title)
  const [kind, setKind] = useState<TimelineItem['kind']>(item.kind)
  const [group, setGroup] = useState(item.group)
  const [owner, setOwner] = useState(item.owner)
  const [startDate, setStartDate] = useState(item.startDate)
  const [endDate, setEndDate] = useState(item.endDate)
  const [progress, setProgress] = useState(item.progress)
  const [error, setError] = useState('')
  const [newItemId] = useState(createId)
  const itemId = 'id' in item ? item.id : newItemId
  const milestone = kind === 'milestone'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return setError('Add a name for this item.')
    if (!getDate(startDate) || !getDate(endDate)) return setError('Choose valid start and end dates.')
    if (!milestone && startDate > endDate) return setError('The end date must be on or after the start date.')
    onSave({
      id: itemId,
      title: title.trim(),
      kind,
      group,
      owner: owner.trim(),
      startDate,
      endDate: milestone ? startDate : endDate,
      progress: milestone ? 0 : Math.max(0, Math.min(100, progress)),
    })
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="item-dialog" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title">
        <div className="dialog-head">
          <div><span className="eyebrow">TIMELINE ITEM</span><h2 id="item-dialog-title">{'id' in item ? 'Edit item' : 'Add to your plan'}</h2></div>
          <button className="icon-button quiet" type="button" aria-label="Close editor" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="kind-switch" role="group" aria-label="Item type">
            <button className={kind === 'task' ? 'selected' : ''} type="button" onClick={() => setKind('task')}><AlignLeft size={15} /> Task</button>
            <button className={kind === 'milestone' ? 'selected' : ''} type="button" onClick={() => setKind('milestone')}><Flag size={15} /> Milestone</button>
          </div>
          <label className="field-label">Name<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="Give this item a name" /></label>
          <div className="form-grid">
            <label className="field-label">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
            {!milestone && <label className="field-label">End date<input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} required /></label>}
          </div>
          <div className="form-grid">
            <label className="field-label">Workstream<select value={group} onChange={(event) => setGroup(event.target.value)}>{groups.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
            <label className="field-label">Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={60} placeholder="Unassigned" /></label>
          </div>
          {!milestone && <label className="field-label progress-field"><span>Progress <strong>{progress}%</strong></span><input type="range" min="0" max="100" step="5" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            {onDelete && <button className="text-action delete-action" type="button" onClick={onDelete}><Trash2 size={15} /> Delete</button>}
            <span className="action-spacer" />
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="submit"><Check size={16} /> Save item</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function TemplatePreview({ template }: { template: TimelineTemplate }) {
  const colors = ['#5f947b', '#5487a4', '#c79339', '#ce765f', '#718a65', '#8c739c']
  const grouped = template.layout === 'swimlane' || template.layout === 'portfolio'
  const renderBar = (item: TimelineTemplate['items'][number], index: number, lane = false) => {
      const left = Math.max(3, Math.min(88, (item.startOffset + 16) * 0.62))
      const width = item.kind === 'milestone' ? 2 : Math.max(8, Math.min(36, item.duration * 0.42))
      const color = colors[Math.max(0, template.groups.indexOf(item.group)) % colors.length]
      return <i key={`${item.title}-${index}`} className={`${item.kind === 'milestone' ? 'preview-milestone' : ''} ${lane ? 'preview-lane-bar' : ''}`} style={{ '--preview-left': `${lane ? Math.max(24, left) : left}%`, '--preview-width': `${width}%`, '--group-color': color, '--preview-row': index } as CSSProperties} />
  }
  return <div className={`template-preview preview-${template.layout}`} data-layout={template.layout} aria-hidden="true">
    {template.items.length === 0 ? <span className="template-preview-empty"><i /></span> : grouped ? template.groups.slice(0, 4).map((group) => {
      const laneItems = template.items.filter((item) => item.group === group).slice(0, 2)
      return <span className="template-lane-track" data-lane={group} key={group}>{laneItems.map((item, index) => renderBar(item, index, true))}</span>
    }) : template.items.slice(0, 5).map((item, index) => <span className="template-track" key={`${item.title}-${index}`}>{renderBar(item, index)}</span>)}
  </div>
}

function TemplatePicker({ onClose, onSelect, onImport, onBlank }: { onClose: () => void; onSelect: (id: TimelineTemplateId) => void; onImport: () => void; onBlank: () => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | TemplateCategory>('all')
  const normalizedSearch = search.trim().toLowerCase()
  const visibleTemplates = GALLERY_TEMPLATES.filter((template) => {
    const matchesCategory = category === 'all' || template.category === category
    const matchesSearch = !normalizedSearch || `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(normalizedSearch)
    return matchesCategory && matchesSearch
  })

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="template-dialog" role="dialog" aria-modal="true" aria-labelledby="template-dialog-title">
      <div className="dialog-head">
        <div><span className="eyebrow">START WITH A PLAN</span><h2 id="template-dialog-title">New timeline</h2></div>
        <button className="icon-button quiet" type="button" aria-label="Close templates" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="template-start-options">
        <button className="template-start-option" type="button" onClick={onImport}><FileSpreadsheet size={17} /><span><strong>Import spreadsheet</strong><small>CSV or Excel workbook</small></span></button>
        <button className="template-start-option" type="button" onClick={onBlank}><Plus size={17} /><span><strong>Start blank</strong><small>Build your own plan</small></span></button>
      </div>
      <div className="template-browser-head"><div><h3>Template gallery</h3><span>All templates included</span></div><span className="template-results-count">{visibleTemplates.length} templates</span></div>
      <div className="template-controls">
        <label className="template-search"><Search size={15} /><input type="search" aria-label="Search templates" placeholder="Search by name or category" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label className="template-category-label"><span>Category</span><select aria-label="Filter template category" value={category} onChange={(event) => setCategory(event.target.value as 'all' | TemplateCategory)}><option value="all">All categories</option>{TEMPLATE_CATEGORIES.map((entry) => <option value={entry} key={entry}>{entry}</option>)}</select></label>
      </div>
      <div className="template-grid">
        {visibleTemplates.map((template) => <button className="template-card" type="button" key={template.id} onClick={() => onSelect(template.id)}>
          <TemplatePreview template={template} />
          <span className="template-card-copy"><span className="template-card-meta"><small>{template.category}</small><small className="free-template-badge">Free</small></span><strong>{template.name}</strong><span>{template.description}</span><small>{template.groups.length} workstreams · {template.items.length} starter items</small></span>
          <ChevronRight className="template-card-arrow" size={16} />
        </button>)}
        {visibleTemplates.length === 0 && <div className="template-empty"><strong>No matching templates</strong><span>Try another search or category.</span><button type="button" onClick={() => { setSearch(''); setCategory('all') }}>Reset filters</button></div>}
      </div>
    </section>
  </div>
}

function ImportDialog({
  error,
  loading,
  onClose,
  onSelect,
  onDownloadTemplate,
}: {
  error: string
  loading: boolean
  onClose: () => void
  onSelect: (file?: File) => void
  onDownloadTemplate: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title">
      <div className="dialog-head">
        <div><span className="eyebrow">BUILD FROM A FILE</span><h2 id="import-dialog-title">Import a timeline</h2></div>
        <button className="icon-button quiet" type="button" aria-label="Close import" onClick={onClose}><X size={18} /></button>
      </div>
      <div className={`import-dropzone ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); onSelect(event.dataTransfer.files[0]) }}>
        <span className="import-drop-icon"><Upload size={20} /></span>
        <strong>Drop a file or choose one</strong>
        <span>CSV, Excel workbook, or Daymark JSON</span>
        <button className="button secondary" type="button" disabled={loading} onClick={() => inputRef.current?.click()}>{loading ? 'Reading file...' : 'Choose file'}</button>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(event) => { onSelect(event.target.files?.[0]); event.currentTarget.value = '' }} />
      </div>
      {error && <p className="import-dialog-error" role="alert">{error}</p>}
      <div className="import-dialog-footer">
        <span>CSV columns: Name, Type, Workstream, Owner, Start date, End date, Progress</span>
        <button className="template-download" type="button" onClick={onDownloadTemplate}><FileSpreadsheet size={15} /> Download CSV template</button>
      </div>
    </section>
  </div>
}

export default function TimelineEditor() {
  const [initial] = useState(() => {
    const projects = loadProjects()
    let activeId = ''
    try { activeId = localStorage.getItem(ACTIVE_KEY) ?? '' } catch { /* storage may be disabled */ }
    return { projects, activeId: projects.some((project) => project.id === activeId) ? activeId : projects[0].id }
  })
  const [projects, setProjects] = useState(initial.projects)
  const [activeId, setActiveId] = useState(initial.activeId)
  const [scale, setScale] = useState<Scale>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('gantt')
  const [dialogItem, setDialogItem] = useState<TimelineItem | ItemDraft | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [pptxExporting, setPptxExporting] = useState(false)
  const [gridMessage, setGridMessage] = useState('')
  const [exportError, setExportError] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [importError, setImportError] = useState('')
  const activeProject = projects.find((project) => project.id === activeId) ?? projects[0]
  const groups = [...new Set([...GROUPS, ...activeProject.groups, ...activeProject.items.map((item) => item.group)])]
  const { start: rangeStart, periods, totalDays } = getRange(activeProject, scale)
  const unitWidth = scale === 'month' ? 132 : 116
  const chartWidth = periods.length * unitWidth
  const [today] = useState(() => new Date())
  const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const todayOffset = daysBetween(rangeStart, todayDate)
  const todayIsVisible = todayOffset >= 0 && todayOffset <= totalDays
  const taskCount = activeProject.items.filter((item) => item.kind === 'task').length
  const milestoneCount = activeProject.items.filter((item) => item.kind === 'milestone').length
  const completedCount = activeProject.items.filter((item) => item.kind === 'task' && item.progress === 100).length

  useEffect(() => {
    try { localStorage.setItem(ACTIVE_KEY, activeId) } catch { /* the project list stays usable without storage */ }
  }, [activeId])

  function commitProjects(next: TimelineProject[]) {
    setProjects(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSaveError(false)
    } catch { setSaveError(true) }
  }

  function updateActive(update: (project: TimelineProject) => TimelineProject) {
    commitProjects(projects.map((project) => project.id === activeId ? { ...update(project), updatedAt: new Date().toISOString() } : project))
  }

  function createProjectFromGallery(templateId: TimelineTemplateId) {
    const project = createProjectFromTemplate(templateId)
    commitProjects([project, ...projects])
    setActiveId(project.id)
    setTemplateOpen(false)
  }

  function deleteProject(projectId: string) {
    const projectToDelete = projects.find((project) => project.id === projectId)
    if (!projectToDelete || !window.confirm(`Delete "${projectToDelete.name}"? This cannot be undone.`)) return
    if (projects.length === 1) {
      const replacement = createBlankProject()
      commitProjects([replacement])
      setActiveId(replacement.id)
      return
    }
    const remaining = projects.filter((project) => project.id !== projectId)
    commitProjects(remaining)
    if (activeId === projectId) setActiveId(remaining[0].id)
  }

  function saveItem(item: TimelineItem) {
    const next = projects.map((project) => {
      if (project.id !== activeId) return project
      const exists = project.items.some((current) => current.id === item.id)
      return { ...project, updatedAt: new Date().toISOString(), items: exists ? project.items.map((current) => current.id === item.id ? item : current) : [...project.items, item] }
    })
    commitProjects(next)
    setDialogItem(null)
  }

  function saveGridItem(item: TimelineItem) {
    updateActive((project) => ({ ...project, items: project.items.map((current) => current.id === item.id ? item : current) }))
  }

  function addGridItem() {
    const item = { ...makeDraft(activeProject, 'task'), id: createId() }
    updateActive((project) => ({ ...project, items: [...project.items, item] }))
  }

  function pasteGridItems(event: ClipboardEvent<HTMLDivElement>, rowIndex: number, columnIndex: number) {
    const text = event.clipboardData.getData('text/plain')
    if (!text.includes('\t') && !text.includes('\n')) return
    event.preventDefault()
    const rows = text.replaceAll('\r', '').split('\n')
    if (rows.at(-1) === '') rows.pop()
    if (rows.length === 0) return

    const firstRow = rows[0].split('\t')
    const headerFields = firstRow.map(gridFieldFromHeader)
    const hasHeaders = headerFields.filter(Boolean).length >= 2
    const dataRows = hasHeaders ? rows.slice(1) : rows
    const nextItems = [...activeProject.items]
    let pastedRows = 0
    let rejectedRows = 0

    dataRows.forEach((row, rowOffset) => {
      const cells = row.split('\t')
      if (cells.every((cell) => cell.trim() === '')) return
      const targetIndex = rowIndex + rowOffset
      const candidate = nextItems[targetIndex]
        ? { ...nextItems[targetIndex] }
        : { ...makeDraft(activeProject, 'task'), id: createId() }
      const touched = new Set<GridField>()

      try {
        cells.forEach((cell, cellIndex) => {
          const field = hasHeaders ? headerFields[cellIndex] : GRID_FIELDS[columnIndex + cellIndex]
          if (!field) return
          const value = cell.trim()
          touched.add(field)
          if (field === 'title') candidate.title = value
          if (field === 'kind') {
            if (value && value.toLowerCase() !== 'task' && value.toLowerCase() !== 'milestone') throw new Error(`Unsupported item type: ${value}`)
            if (value) candidate.kind = value.toLowerCase() as TimelineItem['kind']
          }
          if (field === 'group' && value) candidate.group = value
          if (field === 'owner') candidate.owner = value
          if (field === 'startDate' && value) candidate.startDate = parseGridDate(value)
          if (field === 'endDate' && value) candidate.endDate = parseGridDate(value)
          if (field === 'progress') {
            const progress = value.replace(/%$/, '')
            candidate.progress = progress ? Number(progress) : 0
          }
        })

        if (candidate.kind === 'milestone') {
          const milestoneDate = touched.has('startDate') ? candidate.startDate : touched.has('endDate') ? candidate.endDate : candidate.startDate
          candidate.startDate = milestoneDate
          candidate.endDate = milestoneDate
          candidate.progress = 0
        }
        if (!candidate.title.trim()) throw new Error('A task name is required.')
        if (!candidate.group.trim()) throw new Error('A workstream is required.')
        getDate(candidate.startDate)
        getDate(candidate.endDate)
        if (candidate.startDate > candidate.endDate) throw new Error('End date must be on or after start date.')
        if (!Number.isInteger(candidate.progress) || candidate.progress < 0 || candidate.progress > 100) throw new Error('Progress must be from 0 to 100.')

        if (targetIndex < nextItems.length) nextItems[targetIndex] = candidate
        else nextItems.push(candidate)
        pastedRows += 1
      } catch {
        rejectedRows += 1
      }
    })

    if (pastedRows > 0) updateActive((project) => ({ ...project, items: nextItems }))
    setGridMessage(`${pastedRows} rows pasted${rejectedRows ? ` · ${rejectedRows} skipped` : ''}`)
  }

  function removeItem(itemId: string) {
    commitProjects(projects.map((project) => project.id === activeId ? { ...project, updatedAt: new Date().toISOString(), items: project.items.filter((item) => item.id !== itemId) } : project))
    setDialogItem(null)
  }

  function filename(extension: string) {
    return `${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'timeline'}.${extension}`
  }

  function exportJson() {
    saveBlob(filename('json'), JSON.stringify(activeProject, null, 2), 'application/json')
    setMoreOpen(false)
  }

  function exportCsv() {
    saveBlob(filename('csv'), buildCsv(activeProject), 'text/csv;charset=utf-8')
    setMoreOpen(false)
  }

  function exportSvg() {
    saveBlob(filename('svg'), buildTimelineSvg(activeProject), 'image/svg+xml;charset=utf-8')
    setMoreOpen(false)
  }

  async function exportPptx() {
    setMoreOpen(false)
    setExportError('')
    setPptxExporting(true)
    try {
      const { exportProjectToPptx } = await import('./powerpoint')
      await exportProjectToPptx(activeProject, filename('pptx'))
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'The PowerPoint file could not be created.')
    } finally {
      setPptxExporting(false)
    }
  }

  async function importProject(file?: File) {
    if (!file) return
    setImportError('')
    setImporting(true)
    try {
      const extension = file.name.split('.').at(-1)?.toLowerCase()
      let imported: TimelineProject
      if (extension === 'json') {
        const parsed = parseImportedProject(JSON.parse(await file.text()))
        imported = { ...parsed, id: createId(), name: `${parsed.name} (copy)`, updatedAt: new Date().toISOString() }
      } else if (extension === 'csv') {
        const { parseCsvProject } = await import('./spreadsheetImport')
        imported = parseCsvProject(await file.text(), file.name)
      } else if (extension === 'xlsx') {
        const { parseExcelProject } = await import('./spreadsheetImport')
        imported = await parseExcelProject(file)
      } else if (extension === 'xls' || extension === 'xlsm') {
        throw new Error('Save this workbook as .xlsx and try again.')
      } else {
        throw new Error('Choose a CSV, Excel (.xlsx), or Daymark JSON file.')
      }
      commitProjects([imported, ...projects])
      setActiveId(imported.id)
      setImportOpen(false)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'This file could not be imported.')
    } finally {
      setImporting(false)
    }
  }

  const visibleItems = [...activeProject.items].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))
  const layout = activeProject.layout ?? 'timeline'
  const sectionedLayout = layout === 'swimlane' || layout === 'portfolio' || layout === 'roadmap'

  function renderTimelineItem(item: TimelineItem) {
    const color = getTimelineGroupColors(activeProject.groups, item.group, activeProject.design)
    return <button className={`task-row ${layout === 'milestones' && item.kind === 'milestone' ? 'checkpoint-row' : ''}`} type="button" key={item.id} onClick={() => setDialogItem(item)} aria-label={`Edit ${item.kind}: ${item.title}`}>
      <span className="task-detail"><span className="task-kind" style={{ '--group-color': color.main } as CSSProperties}>{item.kind === 'milestone' ? <Flag size={14} /> : <span className="task-kind-dot" />}</span><span className="task-text"><strong>{item.title}</strong><small><span className="group-label" style={{ '--group-color': color.main } as CSSProperties}>{item.group}</span><span className="owner-separator">·</span>{item.owner || 'Unassigned'}</small></span><Pencil className="row-edit" size={14} /></span>
      <span className={`chart-cell ${viewMode === 'timeline' ? 'timeline-mode' : 'gantt-mode'}`}>
        {item.kind === 'milestone' ? <span className="milestone-marker" style={{ left: `${(daysBetween(rangeStart, getDate(item.startDate)) / totalDays) * chartWidth}px`, '--group-color': color.main } as CSSProperties}><i /><b>{item.title}</b></span> : <span className={`task-bar ${viewMode === 'timeline' ? 'task-bar-line' : ''}`} style={{ left: `${(daysBetween(rangeStart, getDate(item.startDate)) / totalDays) * chartWidth}px`, width: `${Math.max(28, (daysBetween(getDate(item.startDate), addDays(getDate(item.endDate), 1)) / totalDays) * chartWidth)}px`, '--group-color': color.main } as CSSProperties}>
          {viewMode === 'gantt' && <span className="bar-progress" style={{ width: `${item.progress}%` }} />}<span className="bar-label">{viewMode === 'gantt' ? item.progress === 100 ? <Check size={12} /> : null : item.title}</span>
        </span>}
      </span>
    </button>
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark"><ChartGantt size={19} strokeWidth={2.3} /></span><span className="brand-name">daymark<span>.</span></span><span className="free-tag">FREE</span></div>
        <div className="workspace-label"><span>YOUR WORKSPACE</span></div>
        <div className="project-list" aria-label="Your timelines">
          {projects.map((project, index) => <button key={project.id} type="button" className={`project-nav ${project.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(project.id)}>
            <span className={`project-dot dot-${index % 4}`} /><span className="project-nav-text"><strong>{project.name}</strong><small>{project.items.length} items</small></span>{project.id === activeId && <ChevronRight className="project-chevron" size={15} />}
          </button>)}
        </div>
        <button className="new-project" type="button" onClick={() => setTemplateOpen(true)}><FolderPlus size={16} /> New timeline <span>+</span></button>
        <div className="sidebar-bottom">
          <div className="storage-note"><span className="storage-icon"><Sparkles size={15} /></span><div><strong>Free, by default</strong><small>Saved on this device</small></div></div>
          <button className="help-link" type="button" onClick={() => window.alert('Daymark keeps your timelines in this browser. Export a JSON backup to move them to another device.')}><CircleHelp size={16} /> Help &amp; storage</button>
          <div className="local-label"><span className="online-dot" /> LOCAL WORKSPACE</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{activeProject.name}</strong></div>
          <div className="topbar-actions">
            <span className={`save-indicator ${saveError ? 'save-error' : ''}`}><span />{saveError ? 'Storage limit reached' : 'All changes saved'}</span>
            <button className="button secondary import-button" type="button" onClick={() => { setImportError(''); setImportOpen(true) }}><Upload size={15} /> Import</button>
            <div className="export-wrap">
              <button className="button primary" type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen}><ArrowDownToLine size={16} /> Export <ChevronDown size={14} /></button>
              {moreOpen && <div className="export-menu" role="menu">
                <button role="menuitem" type="button" onClick={exportPptx}><ChartGantt size={16} /> PowerPoint (.pptx) <small>Editable slide shapes</small></button>
                <button role="menuitem" type="button" onClick={exportSvg}><ArrowDownToLine size={16} /> SVG image <small>Vector artwork</small></button>
                <button role="menuitem" type="button" onClick={exportCsv}><FileSpreadsheet size={16} /> CSV data <small>Spreadsheet-ready</small></button>
                <button role="menuitem" type="button" onClick={exportJson}><FileJson size={16} /> JSON backup <small>Editable project file</small></button>
                <button role="menuitem" type="button" onClick={() => { window.print(); setMoreOpen(false) }}><Printer size={16} /> Print / PDF <small>Presentation layout</small></button>
              </div>}
            </div>
          </div>
        </header>

        <section className="page-content">
          {(importError || exportError) && <div className="inline-error" role="alert"><span>{importError || exportError}</span><button className="icon-button quiet" type="button" aria-label="Dismiss error" onClick={() => { setImportError(''); setExportError('') }}><X size={16} /></button></div>}
          {pptxExporting && <div className="export-progress" role="status">Preparing editable PowerPoint...</div>}
          <div className="project-heading">
            <div className="title-wrap"><div className="eyebrow"><span className="eyebrow-line" /> PROJECT TIMELINE <span className="private-chip">PRIVATE</span></div><input className="project-title" aria-label="Timeline name" value={activeProject.name} maxLength={70} onChange={(event) => updateActive((project) => ({ ...project, name: event.target.value }))} /><div className="project-subtitle"><CalendarDays size={15} /> {formatDate(activeProject.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} <span className="date-separator">to</span> {formatDate(activeProject.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}<span className="subtitle-dot" /> Saved {formatDate(activeProject.updatedAt.slice(0, 10), { month: 'short', day: 'numeric' })}</div></div>
            <div className="heading-side"><span className="local-plan-badge"><LockKeyhole size={13} /> On this device</span><button className="icon-button border-button" type="button" aria-label="Delete this timeline" title="Delete this timeline" onClick={() => deleteProject(activeProject.id)}><Trash2 size={17} /></button></div>
          </div>

          <div className="summary-strip" aria-label="Timeline summary">
            <div className="summary-item"><span className="summary-icon icon-calendar"><CalendarDays size={17} /></span><div><small>TIMEFRAME</small><strong>{periods.length} {scale === 'month' ? 'months' : 'weeks'}</strong></div></div><div className="summary-divider" />
            <div className="summary-item"><span className="summary-icon icon-tasks"><AlignLeft size={17} /></span><div><small>TASKS</small><strong>{taskCount} <span className="summary-muted">items</span></strong></div></div><div className="summary-divider" />
            <div className="summary-item"><span className="summary-icon icon-milestone"><Flag size={17} /></span><div><small>MILESTONES</small><strong>{milestoneCount} <span className="summary-muted">marked</span></strong></div></div><div className="summary-divider" />
            <div className="summary-item"><span className="summary-icon icon-done"><Check size={17} /></span><div><small>COMPLETED</small><strong>{completedCount} <span className="summary-muted">of {taskCount}</span></strong></div></div>
            <div className="summary-spacer" /><span className="free-forever"><Sparkles size={14} /> Unlimited timelines, free</span>
          </div>

          <section className={`editor-panel ${viewMode === 'data' ? 'data-mode' : ''}`} aria-label="Timeline editor">
            <div className="editor-toolbar">
              <div className="view-switch" role="group" aria-label="Editor view"><button className={viewMode === 'timeline' ? 'selected' : ''} type="button" onClick={() => setViewMode('timeline')}><AlignLeft size={15} /> Timeline</button><button className={viewMode === 'gantt' ? 'selected' : ''} type="button" onClick={() => setViewMode('gantt')}><ChartGantt size={16} /> Gantt</button><button className={viewMode === 'data' ? 'selected' : ''} type="button" onClick={() => setViewMode('data')}><FileSpreadsheet size={15} /> Data</button></div>
              {viewMode !== 'data' && <><div className="toolbar-divider" />
                <div className="scale-switch" role="group" aria-label="Time scale"><button className={scale === 'week' ? 'selected' : ''} type="button" onClick={() => setScale('week')}>Week</button><button className={scale === 'month' ? 'selected' : ''} type="button" onClick={() => setScale('month')}>Month</button></div>
                <div className="toolbar-spacer" />
                <button className="today-button" type="button" onClick={() => { const month = startOfMonth(new Date()); updateActive((project) => ({ ...project, startDate: addMonths(month, -1).toISOString().slice(0, 10), endDate: addDays(addMonths(month, 5), -1).toISOString().slice(0, 10) })); setScale('month') }}><Clock3 size={15} /> Today</button>
                <span className="toolbar-separator" />
                <button className="icon-button zoom-control" type="button" aria-label="Show weeks" title="Show weeks" onClick={() => setScale('week')}><Search size={15} /><span>−</span></button>
                <button className="icon-button zoom-control" type="button" aria-label="Show months" title="Show months" onClick={() => setScale('month')}><Search size={15} /><span>+</span></button>
                <button className="icon-button quiet print-control" type="button" aria-label="Print timeline" title="Print / save as PDF" onClick={() => window.print()}><Printer size={16} /></button>
              </>}
              <label className="design-select"><Palette size={14} /><select aria-label="Timeline design" value={activeProject.design} onChange={(event) => updateActive((project) => ({ ...project, design: event.target.value as TimelineDesign }))}>{TIMELINE_DESIGNS.map((design) => <option key={design.id} value={design.id}>{design.name}</option>)}</select></label>
            </div>

            {viewMode === 'data' && <SpreadsheetGrid items={activeProject.items} groups={groups} message={gridMessage} onCommit={saveGridItem} onPaste={pasteGridItems} onAdd={addGridItem} onDetails={setDialogItem} />}
            <div className="timeline-scroll"><div className="timeline-grid" data-design={activeProject.design} data-layout={layout} style={{ '--chart-width': `${chartWidth}px`, '--unit-width': `${unitWidth}px` } as CSSProperties}>
              <div className="task-head"><span>WORKSTREAM / OWNER</span></div>
              <div className="chart-head"><div className="periods-row" style={{ width: chartWidth }}>{periods.map((period, index) => {
                const quarterStart = index === 0 || period.start.getUTCMonth() % 3 === 0
                const quarterView = (layout === 'roadmap' || layout === 'portfolio') && scale === 'month'
                return <div className={`period-cell ${quarterView ? 'quarter-cell' : ''}`} key={`${period.start.toISOString()}-${index}`}><strong>{quarterView ? quarterStart ? `Q${Math.floor(period.start.getUTCMonth() / 3) + 1}` : '' : period.label}</strong><small>{quarterView ? quarterStart ? String(period.start.getUTCFullYear()) : '' : period.sublabel}</small></div>
              })}</div></div>
              <div className="task-rows">
                {visibleItems.length === 0 ? <div className="empty-table"><span className="empty-mark"><ChartGantt size={20} /></span><strong>Your timeline is ready for its first item.</strong><span>Add a task or milestone to start mapping the work.</span><button className="button primary" type="button" onClick={() => setDialogItem(makeDraft(activeProject, 'task'))}>Add your first task <ChevronRight size={15} /></button></div> : sectionedLayout ? groups.flatMap((group) => {
                  const laneItems = visibleItems.filter((item) => item.group === group)
                  if (laneItems.length === 0) return []
                  const colors = getTimelineGroupColors(activeProject.groups, group, activeProject.design)
                  return [<div className={`lane-heading lane-heading-${layout}`} key={`lane-${group}`} style={{ '--group-color': colors.main, '--group-tint': colors.light } as CSSProperties}><strong>{group}</strong><span>{laneItems.length} items</span></div>, ...laneItems.map(renderTimelineItem)]
                }) : visibleItems.map(renderTimelineItem)}
                {visibleItems.length > 0 && <div className="add-row"><button type="button" className="add-row-main" onClick={() => setDialogItem(makeDraft(activeProject, 'task'))}><span className="add-row-plus">+</span> Add a task</button><span className="add-row-hint">or add a <button type="button" className="inline-link" onClick={() => setDialogItem(makeDraft(activeProject, 'milestone'))}>milestone</button></span></div>}
              </div>
              {todayIsVisible && <div className="chart-overlay" aria-hidden="true"><span className="today-line" style={{ left: `${(todayOffset / totalDays) * chartWidth}px` }}><i>TODAY</i></span></div>}
            </div></div>
            <div className="editor-foot">{viewMode !== 'data' && <div className="legend"><span><i className="legend-task" /> Task</span><span><i className="legend-milestone" /> Milestone</span><span><i className="legend-progress" /> Progress</span></div>}<span className="chart-foot-note"><span className="online-dot" /> Saved locally in this browser</span></div>
          </section>

          <div className="below-editor"><span><strong>{activeProject.items.length}</strong> items in this plan</span><span>Dates are calendar days · <button type="button" onClick={exportCsv}>Download data <ArrowDownToLine size={13} /></button></span></div>
        </section>
      </main>
      <div className="quick-add"><button type="button" aria-label="Add task" title="Add task" onClick={() => setDialogItem(makeDraft(activeProject, 'task'))}>+</button></div>
      {dialogItem && <ItemEditor key={'id' in dialogItem ? dialogItem.id : 'new-item'} item={dialogItem} groups={groups} onClose={() => setDialogItem(null)} onSave={saveItem} onDelete={'id' in dialogItem ? () => { if (window.confirm(`Delete "${dialogItem.title}"?`)) removeItem(dialogItem.id) } : undefined} />}
      {templateOpen && <TemplatePicker onClose={() => setTemplateOpen(false)} onSelect={createProjectFromGallery} onImport={() => { setTemplateOpen(false); setImportError(''); setImportOpen(true) }} onBlank={() => createProjectFromGallery('blank')} />}
      {importOpen && <ImportDialog error={importError} loading={importing} onClose={() => setImportOpen(false)} onSelect={(file) => { void importProject(file) }} onDownloadTemplate={() => saveBlob('daymark-csv-template.csv', buildCsvTemplate(), 'text/csv;charset=utf-8')} />}
    </div>
  )
}