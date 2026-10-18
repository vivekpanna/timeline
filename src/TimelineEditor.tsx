import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
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
  Pencil,
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
  buildTimelineSvg,
  createBlankProject,
  createId,
  createProjectFromTemplate,
  createSampleProject,
  daysBetween,
  formatDate,
  getDate,
  getProjectDateRange,
  GROUPS,
  isoWeekNumber,
  parseImportedProject,
  startOfMonth,
  startOfWeek,
  TIMELINE_TEMPLATES,
  type TimelineItem,
  type TimelineProject,
  type TimelineTemplate,
  type TimelineTemplateId,
} from './timeline'
import './TimelineEditor.css'

const STORAGE_KEY = 'daymark.projects.v1'
const ACTIVE_KEY = 'daymark.active-project.v1'
const GROUP_COLORS: Record<string, string> = {
  Research: '#5f947b',
  Design: '#5487a4',
  Engineering: '#c79339',
  Launch: '#ce765f',
}

type Scale = 'month' | 'week'
type ViewMode = 'timeline' | 'gantt'
type ItemDraft = Omit<TimelineItem, 'id'>

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

function colorForGroup(group: string) {
  if (GROUP_COLORS[group]) return GROUP_COLORS[group]
  const colors = ['#688c83', '#718a65', '#8c739c', '#5487a4', '#c79339', '#ce765f']
  const hash = [...group].reduce((total, character) => total + character.charCodeAt(0), 0)
  return colors[hash % colors.length]
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
  return <div className={`template-preview preview-${template.id}`} aria-hidden="true">
    {template.items.length === 0 ? <span className="template-preview-empty"><i /></span> : template.items.slice(0, 5).map((item, index) => {
      const left = Math.max(3, Math.min(88, (item.startOffset + 16) * 0.62))
      const width = item.kind === 'milestone' ? 2 : Math.max(8, Math.min(36, item.duration * 0.42))
      const color = colors[Math.max(0, template.groups.indexOf(item.group)) % colors.length]
      return <span className="template-track" key={`${item.title}-${index}`}><i className={item.kind === 'milestone' ? 'preview-milestone' : ''} style={{ '--preview-left': `${left}%`, '--preview-width': `${width}%`, '--group-color': color } as CSSProperties} /></span>
    })}
  </div>
}

function TemplatePicker({ onClose, onSelect }: { onClose: () => void; onSelect: (id: TimelineTemplateId) => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="template-dialog" role="dialog" aria-modal="true" aria-labelledby="template-dialog-title">
      <div className="dialog-head">
        <div><span className="eyebrow">START WITH A PLAN</span><h2 id="template-dialog-title">Choose a template</h2></div>
        <button className="icon-button quiet" type="button" aria-label="Close templates" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="template-grid">
        {TIMELINE_TEMPLATES.map((template) => <button className="template-card" type="button" key={template.id} onClick={() => onSelect(template.id)}>
          <TemplatePreview template={template} />
          <span className="template-card-copy"><strong>{template.name}</strong><span>{template.description}</span><small>{template.groups.length} workstreams · {template.items.length} starter items</small></span>
          <ChevronRight className="template-card-arrow" size={16} />
        </button>)}
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
  const [templateOpen, setTemplateOpen] = useState(false)
  const [pptxExporting, setPptxExporting] = useState(false)
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

  function importProject(file?: File) {
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = parseImportedProject(JSON.parse(String(reader.result)))
        const copy = { ...imported, id: createId(), name: `${imported.name} (copy)`, updatedAt: new Date().toISOString() }
        commitProjects([copy, ...projects])
        setActiveId(copy.id)
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'This file is not a valid Daymark timeline.')
      }
    }
    reader.onerror = () => setImportError('The selected file could not be read.')
    reader.readAsText(file)
  }

  const visibleItems = [...activeProject.items].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))

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
            <button className="button secondary import-button" type="button" onClick={() => document.getElementById('project-import')?.click()}><Upload size={15} /> Import</button>
            <input id="project-import" type="file" accept="application/json,.json" hidden onChange={(event) => { importProject(event.target.files?.[0]); event.currentTarget.value = '' }} />
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

          <section className="editor-panel" aria-label="Timeline editor">
            <div className="editor-toolbar">
              <div className="view-switch" role="group" aria-label="Timeline view"><button className={viewMode === 'timeline' ? 'selected' : ''} type="button" onClick={() => setViewMode('timeline')}><AlignLeft size={15} /> Timeline</button><button className={viewMode === 'gantt' ? 'selected' : ''} type="button" onClick={() => setViewMode('gantt')}><ChartGantt size={16} /> Gantt</button></div>
              <div className="toolbar-divider" />
              <div className="scale-switch" role="group" aria-label="Time scale"><button className={scale === 'week' ? 'selected' : ''} type="button" onClick={() => setScale('week')}>Week</button><button className={scale === 'month' ? 'selected' : ''} type="button" onClick={() => setScale('month')}>Month</button></div>
              <div className="toolbar-spacer" />
              <button className="today-button" type="button" onClick={() => { const month = startOfMonth(new Date()); updateActive((project) => ({ ...project, startDate: addMonths(month, -1).toISOString().slice(0, 10), endDate: addDays(addMonths(month, 5), -1).toISOString().slice(0, 10) })); setScale('month') }}><Clock3 size={15} /> Today</button>
              <span className="toolbar-separator" />
              <button className="icon-button zoom-control" type="button" aria-label="Show weeks" title="Show weeks" onClick={() => setScale('week')}><Search size={15} /><span>−</span></button>
              <button className="icon-button zoom-control" type="button" aria-label="Show months" title="Show months" onClick={() => setScale('month')}><Search size={15} /><span>+</span></button>
              <button className="icon-button quiet print-control" type="button" aria-label="Print timeline" title="Print / save as PDF" onClick={() => window.print()}><Printer size={16} /></button>
            </div>

            <div className="timeline-scroll"><div className="timeline-grid" style={{ '--chart-width': `${chartWidth}px`, '--unit-width': `${unitWidth}px` } as CSSProperties}>
              <div className="task-head"><span>WORKSTREAM / OWNER</span></div>
              <div className="chart-head"><div className="periods-row" style={{ width: chartWidth }}>{periods.map((period, index) => <div className="period-cell" key={`${period.start.toISOString()}-${index}`}><strong>{period.label}</strong><small>{period.sublabel}</small></div>)}</div></div>
              <div className="task-rows">
                {visibleItems.length === 0 ? <div className="empty-table"><span className="empty-mark"><ChartGantt size={20} /></span><strong>Your timeline is ready for its first item.</strong><span>Add a task or milestone to start mapping the work.</span><button className="button primary" type="button" onClick={() => setDialogItem(makeDraft(activeProject, 'task'))}>Add your first task <ChevronRight size={15} /></button></div> : visibleItems.map((item) => <button className="task-row" type="button" key={item.id} onClick={() => setDialogItem(item)} aria-label={`Edit ${item.kind}: ${item.title}`}>
                  <span className="task-detail"><span className="task-kind" style={{ '--group-color': colorForGroup(item.group) } as CSSProperties}>{item.kind === 'milestone' ? <Flag size={14} /> : <span className="task-kind-dot" />}</span><span className="task-text"><strong>{item.title}</strong><small><span className="group-label" style={{ '--group-color': colorForGroup(item.group) } as CSSProperties}>{item.group}</span><span className="owner-separator">·</span>{item.owner || 'Unassigned'}</small></span><Pencil className="row-edit" size={14} /></span>
                  <span className={`chart-cell ${viewMode === 'timeline' ? 'timeline-mode' : 'gantt-mode'}`}>
                    {item.kind === 'milestone' ? <span className="milestone-marker" style={{ left: `${(daysBetween(rangeStart, getDate(item.startDate)) / totalDays) * chartWidth}px`, '--group-color': colorForGroup(item.group) } as CSSProperties}><i /><b>{item.title}</b></span> : <span className={`task-bar ${viewMode === 'timeline' ? 'task-bar-line' : ''}`} style={{ left: `${(daysBetween(rangeStart, getDate(item.startDate)) / totalDays) * chartWidth}px`, width: `${Math.max(28, (daysBetween(getDate(item.startDate), addDays(getDate(item.endDate), 1)) / totalDays) * chartWidth)}px`, '--group-color': colorForGroup(item.group) } as CSSProperties}>
                      {viewMode === 'gantt' && <span className="bar-progress" style={{ width: `${item.progress}%` }} />}<span className="bar-label">{viewMode === 'gantt' ? item.progress === 100 ? <Check size={12} /> : null : item.title}</span>
                    </span>}
                  </span>
                </button>)}
                {visibleItems.length > 0 && <div className="add-row"><button type="button" className="add-row-main" onClick={() => setDialogItem(makeDraft(activeProject, 'task'))}><span className="add-row-plus">+</span> Add a task</button><span className="add-row-hint">or add a <button type="button" className="inline-link" onClick={() => setDialogItem(makeDraft(activeProject, 'milestone'))}>milestone</button></span></div>}
              </div>
              {todayIsVisible && <div className="chart-overlay" aria-hidden="true"><span className="today-line" style={{ left: `${(todayOffset / totalDays) * chartWidth}px` }}><i>TODAY</i></span></div>}
            </div></div>
            <div className="editor-foot"><div className="legend"><span><i className="legend-task" /> Task</span><span><i className="legend-milestone" /> Milestone</span><span><i className="legend-progress" /> Progress</span></div><span className="chart-foot-note"><span className="online-dot" /> Saved locally in this browser</span></div>
          </section>

          <div className="below-editor"><span><strong>{activeProject.items.length}</strong> items in this plan</span><span>Dates are calendar days · <button type="button" onClick={exportCsv}>Download data <ArrowDownToLine size={13} /></button></span></div>
        </section>
      </main>
      <div className="quick-add"><button type="button" aria-label="Add task" title="Add task" onClick={() => setDialogItem(makeDraft(activeProject, 'task'))}>+</button></div>
      {dialogItem && <ItemEditor key={'id' in dialogItem ? dialogItem.id : 'new-item'} item={dialogItem} groups={groups} onClose={() => setDialogItem(null)} onSave={saveItem} onDelete={'id' in dialogItem ? () => { if (window.confirm(`Delete "${dialogItem.title}"?`)) removeItem(dialogItem.id) } : undefined} />}
      {templateOpen && <TemplatePicker onClose={() => setTemplateOpen(false)} onSelect={createProjectFromGallery} />}
    </div>
  )
}