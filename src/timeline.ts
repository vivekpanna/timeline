export const GROUPS = ['Research', 'Design', 'Engineering', 'Launch'] as const
export type ItemKind = 'task' | 'milestone'
export type TimelineTemplateId = string
export type TimelineLayout = 'timeline' | 'roadmap' | 'swimlane' | 'portfolio' | 'milestones' | 'event'
export type TimelinePresentation = 'timeline' | 'roadmap' | 'swimlane'
export const TEMPLATE_CATEGORIES = ['Project delivery', 'Product roadmaps', 'Program management', 'IT & infrastructure', 'Software & product', 'Marketing & growth', 'Events', 'Research & trials'] as const
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]
export type TimelineDesign = 'classic' | 'colorful' | 'minimal'

export const DEFAULT_TIMELINE_DESIGN: TimelineDesign = 'classic'
export const TIMELINE_DESIGNS: { id: TimelineDesign; name: string }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'colorful', name: 'Colorful' },
  { id: 'minimal', name: 'Minimal' },
]

const DESIGN_PALETTES: Record<TimelineDesign, { main: string[]; light: string[] }> = {
  classic: {
    main: ['#5f947b', '#5487a4', '#c79339', '#ce765f', '#718a65', '#8c739c'],
    light: ['#e4eee8', '#e5eef2', '#f5edd9', '#f5e7e2', '#eaefe4', '#eee8f1'],
  },
  colorful: {
    main: ['#267a71', '#3d70a3', '#bd6c38', '#8a6d9e', '#637e3d', '#b15168'],
    light: ['#dcefeb', '#e0eaf4', '#f6e8dc', '#eee7f2', '#e8eedc', '#f5e3e8'],
  },
  minimal: {
    main: ['#455a50', '#586c64', '#6d7d76', '#84918a', '#657785', '#727268'],
    light: ['#e5eae7', '#e7ebe9', '#eaedeb', '#edf0ee', '#e8ebed', '#ebebe8'],
  },
}

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
  design: TimelineDesign
  layout?: TimelineLayout
  presentation?: TimelinePresentation
  startDate: string
  endDate: string
  groups: string[]
  items: TimelineItem[]
  templateId?: TimelineTemplateId
  createdAt: string
  updatedAt: string
}

interface TemplateItem extends Omit<TimelineItem, 'id' | 'startDate' | 'endDate'> {
  startOffset: number
  duration: number
}

export interface TimelineTemplate {
  id: TimelineTemplateId
  name: string
  description: string
  category: TemplateCategory
  layout: TimelineLayout
  groups: string[]
  items: TemplateItem[]
}

export function getTimelineGroupColors(groups: string[], group: string, design: TimelineDesign = DEFAULT_TIMELINE_DESIGN) {
  const palette = DESIGN_PALETTES[design]
  const groupIndex = groups.indexOf(group)
  const fallbackIndex = [...group].reduce((total, character) => total + character.charCodeAt(0), 0)
  const index = (groupIndex < 0 ? fallbackIndex : groupIndex) % palette.main.length
  return { main: palette.main[index], light: palette.light[index] }
}

export function getProjectPresentation(project: Pick<TimelineProject, 'layout' | 'presentation'>): TimelinePresentation {
  if (project.presentation) return project.presentation
  if (project.layout === 'roadmap' || project.layout === 'portfolio') return 'roadmap'
  if (project.layout === 'swimlane') return 'swimlane'
  return 'timeline'
}

const BASE_TIMELINE_TEMPLATES: Omit<TimelineTemplate, 'category'>[] = [
  {
    id: 'product-launch',
    name: 'Product launch',
    description: 'Move from discovery through build, beta, and launch.',
    layout: 'swimlane',
    groups: ['Research', 'Design', 'Engineering', 'Launch'],
    items: [
      { title: 'Customer interviews', kind: 'task', group: 'Research', owner: 'Jordan Lee', startOffset: -12, duration: 16, progress: 100 },
      { title: 'Product direction', kind: 'task', group: 'Research', owner: 'Maya K.', startOffset: 4, duration: 18, progress: 70 },
      { title: 'Experience prototype', kind: 'task', group: 'Design', owner: 'Maya K.', startOffset: 18, duration: 28, progress: 35 },
      { title: 'Core build', kind: 'task', group: 'Engineering', owner: 'Alex Chen', startOffset: 40, duration: 55, progress: 0 },
      { title: 'Private beta', kind: 'task', group: 'Launch', owner: 'Jordan Lee', startOffset: 88, duration: 27, progress: 0 },
      { title: 'Public launch', kind: 'milestone', group: 'Launch', owner: 'Team', startOffset: 126, duration: 0, progress: 0 },
    ],
  },
  {
    id: 'quarterly-roadmap',
    name: 'Quarterly roadmap',
    description: 'Prioritize outcomes across product, growth, and reliability.',
    layout: 'roadmap',
    groups: ['Customer value', 'Growth', 'Platform', 'Reliability'],
    items: [
      { title: 'Self-serve onboarding', kind: 'task', group: 'Customer value', owner: 'Product', startOffset: 2, duration: 48, progress: 20 },
      { title: 'Usage insights', kind: 'task', group: 'Customer value', owner: 'Data', startOffset: 30, duration: 45, progress: 0 },
      { title: 'Referral experiment', kind: 'task', group: 'Growth', owner: 'Marketing', startOffset: 12, duration: 28, progress: 50 },
      { title: 'Regional expansion', kind: 'milestone', group: 'Growth', owner: 'Leadership', startOffset: 92, duration: 0, progress: 0 },
      { title: 'API performance', kind: 'task', group: 'Platform', owner: 'Engineering', startOffset: 8, duration: 52, progress: 10 },
      { title: 'Access controls', kind: 'task', group: 'Reliability', owner: 'Security', startOffset: 46, duration: 38, progress: 0 },
    ],
  },
  {
    id: 'swimlane-plan',
    name: 'Swimlane delivery',
    description: 'Coordinate parallel work across teams and handoffs.',
    layout: 'swimlane',
    groups: ['Web', 'Mobile', 'Data', 'Operations'],
    items: [
      { title: 'Interaction design', kind: 'task', group: 'Web', owner: 'Design', startOffset: -4, duration: 22, progress: 100 },
      { title: 'Web implementation', kind: 'task', group: 'Web', owner: 'Frontend', startOffset: 20, duration: 42, progress: 25 },
      { title: 'Mobile integration', kind: 'task', group: 'Mobile', owner: 'Apps', startOffset: 31, duration: 47, progress: 0 },
      { title: 'Event instrumentation', kind: 'task', group: 'Data', owner: 'Analytics', startOffset: 16, duration: 30, progress: 40 },
      { title: 'Load testing', kind: 'task', group: 'Operations', owner: 'SRE', startOffset: 68, duration: 18, progress: 0 },
      { title: 'Production handoff', kind: 'milestone', group: 'Operations', owner: 'Team', startOffset: 94, duration: 0, progress: 0 },
    ],
  },
  {
    id: 'milestone-map',
    name: 'Milestone plan',
    description: 'Make key decisions, reviews, and delivery dates visible.',
    layout: 'milestones',
    groups: ['Definition', 'Review', 'Delivery'],
    items: [
      { title: 'Scope agreed', kind: 'milestone', group: 'Definition', owner: 'Sponsor', startOffset: 0, duration: 0, progress: 0 },
      { title: 'Detailed planning', kind: 'task', group: 'Definition', owner: 'Project lead', startOffset: 1, duration: 24, progress: 60 },
      { title: 'Design review', kind: 'milestone', group: 'Review', owner: 'Steering group', startOffset: 35, duration: 0, progress: 0 },
      { title: 'Build and validate', kind: 'task', group: 'Delivery', owner: 'Delivery team', startOffset: 36, duration: 44, progress: 0 },
      { title: 'Acceptance review', kind: 'milestone', group: 'Review', owner: 'Stakeholders', startOffset: 88, duration: 0, progress: 0 },
      { title: 'Go live', kind: 'milestone', group: 'Delivery', owner: 'Team', startOffset: 104, duration: 0, progress: 0 },
    ],
  },
  {
    id: 'blank',
    name: 'Start from blank',
    description: 'Create an empty timeline and shape it around your work.',
    layout: 'timeline',
    groups: [...GROUPS],
    items: [],
  },
]

const CATALOG_ENTRIES: [id: string, name: string, category: TemplateCategory, focus: string][] = [
  ['operating-model-map', 'Operating Model Blueprint', 'Program management', 'operating model'],
  ['portfolio-governance', 'Portfolio Governance Cycle', 'Program management', 'governance'],
  ['transformation-waves', 'Transformation Wave Plan', 'Program management', 'transformation'],
  ['benefits-realization', 'Benefits Tracking Plan', 'Program management', 'benefits'],
  ['cross-program-dependencies', 'Cross-Program Alignment', 'Program management', 'cross-program dependencies'],
  ['customer-onboarding', 'Customer Onboarding Journey', 'Project delivery', 'customer onboarding'],
  ['service-improvement', 'Service Improvement Initiative', 'Project delivery', 'service improvement'],
  ['vendor-transition', 'Supplier Transition Plan', 'Project delivery', 'supplier transition'],
  ['approval-handoff', 'Approval and Handover Plan', 'Project delivery', 'handover'],
  ['product-readiness', 'Product Readiness Review', 'Project delivery', 'product readiness'],
  ['partner-integration', 'Partner Integration Delivery', 'Project delivery', 'partner integration'],
  ['delivery-assurance', 'Delivery Assurance Checkpoints', 'Project delivery', 'delivery assurance'],
  ['operations-change', 'Operations Change Rollout', 'Project delivery', 'operations change'],
  ['launch-readiness', 'Launch Readiness Sequence', 'Project delivery', 'launch readiness'],
  ['client-implementation', 'Client Implementation Plan', 'Project delivery', 'client implementation'],
  ['platform-evolution', 'Platform Evolution Map', 'Product roadmaps', 'platform evolution'],
  ['experience-priorities', 'Experience Improvement Horizon', 'Product roadmaps', 'experience improvements'],
  ['growth-opportunities', 'Growth Opportunity Roadmap', 'Product roadmaps', 'growth opportunities'],
  ['reliability-investments', 'Reliability Investment Plan', 'Product roadmaps', 'reliability improvements'],
  ['data-capabilities', 'Data Capability Roadmap', 'Product roadmaps', 'data capabilities'],
  ['regional-expansion', 'Regional Expansion Horizon', 'Product roadmaps', 'regional expansion'],
  ['release-horizon', 'Release Horizon Plan', 'Product roadmaps', 'release planning'],
  ['technology-direction', 'Technology Direction Map', 'Product roadmaps', 'technology direction'],
  ['cloud-transition', 'Cloud Transition Sequence', 'IT & infrastructure', 'cloud transition'],
  ['network-renewal', 'Network Renewal Plan', 'IT & infrastructure', 'network renewal'],
  ['identity-upgrade', 'Identity Access Upgrade', 'IT & infrastructure', 'identity access'],
  ['data-center-retirement', 'Data Center Exit Plan', 'IT & infrastructure', 'data center exit'],
  ['security-controls', 'Security Controls Rollout', 'IT & infrastructure', 'security controls'],
  ['workplace-modernization', 'Workplace Technology Refresh', 'IT & infrastructure', 'workplace technology'],
  ['systems-consolidation', 'Systems Consolidation Plan', 'IT & infrastructure', 'systems consolidation'],
  ['feature-discovery', 'Feature Discovery to Release', 'Software & product', 'feature delivery'],
  ['mobile-experience', 'Mobile Experience Delivery', 'Software & product', 'mobile experience'],
  ['web-platform-renewal', 'Web Platform Renewal', 'Software & product', 'web platform renewal'],
  ['api-rollout', 'API Adoption Rollout', 'Software & product', 'API adoption'],
  ['quality-engineering', 'Quality Engineering Cycle', 'Software & product', 'quality engineering'],
  ['iteration-release', 'Iteration Release Train', 'Software & product', 'iteration release'],
  ['product-validation', 'Product Validation Cycle', 'Software & product', 'product validation'],
  ['campaign-rollout', 'Campaign Rollout Calendar', 'Marketing & growth', 'campaign rollout'],
  ['market-entry', 'Market Entry Sequence', 'Marketing & growth', 'market entry'],
  ['brand-refresh', 'Brand Refresh Program', 'Marketing & growth', 'brand refresh'],
  ['content-engine', 'Content Program Calendar', 'Marketing & growth', 'content program'],
  ['partner-growth', 'Partner Growth Initiative', 'Marketing & growth', 'partner growth'],
  ['annual-conference', 'Conference Production Plan', 'Events', 'conference production'],
  ['community-gathering', 'Community Gathering Runway', 'Events', 'community event'],
  ['product-showcase', 'Product Showcase Schedule', 'Events', 'product showcase'],
  ['field-study', 'Field Research Cycle', 'Research & trials', 'field research'],
  ['clinical-research', 'Clinical Study Checkpoints', 'Research & trials', 'clinical study'],
  ['regulatory-evidence', 'Evidence and Review Path', 'Research & trials', 'evidence review'],
  ['product-research-evidence', 'Product Research Evidence Path', 'Research & trials', 'product research'],
]

const CATEGORY_PROFILES: Record<TemplateCategory, { groups: string[]; owners: string[] }> = {
  'Project delivery': { groups: ['Discover', 'Plan', 'Deliver', 'Review', 'Handover'], owners: ['Project lead', 'Planning team', 'Delivery team', 'Quality lead', 'Operations'] },
  'Product roadmaps': { groups: ['Explore', 'Shape', 'Build', 'Release'], owners: ['Product', 'Design', 'Engineering', 'Product'] },
  'Program management': { groups: ['Mobilize', 'Govern', 'Integrate', 'Measure'], owners: ['Sponsor', 'PMO', 'Workstream leads', 'Benefits lead'] },
  'IT & infrastructure': { groups: ['Assess', 'Design', 'Transition', 'Operate'], owners: ['IT lead', 'Architecture', 'Infrastructure', 'Service owner'] },
  'Software & product': { groups: ['Discover', 'Design', 'Build', 'Validate', 'Release'], owners: ['Product', 'Design', 'Engineering', 'QA', 'Release lead'] },
  'Marketing & growth': { groups: ['Insight', 'Strategy', 'Activation', 'Measure'], owners: ['Research', 'Marketing', 'Campaign team', 'Analytics'] },
  Events: { groups: ['Plan', 'Produce', 'Promote', 'Deliver'], owners: ['Event lead', 'Production', 'Communications', 'Operations'] },
  'Research & trials': { groups: ['Protocol', 'Recruit', 'Study', 'Analyze'], owners: ['Study lead', 'Research team', 'Site team', 'Analyst'] },
}

const LANE_PROFILES: Record<TemplateCategory, { groups: string[]; owners: string[] }> = {
  'Project delivery': { groups: ['Planning', 'Delivery', 'Quality', 'Operations'], owners: ['Project lead', 'Delivery team', 'Quality lead', 'Service owner'] },
  'Product roadmaps': { groups: ['Customer value', 'Growth', 'Platform', 'Reliability'], owners: ['Product', 'Growth', 'Engineering', 'SRE'] },
  'Program management': { groups: ['Governance', 'Workstream A', 'Workstream B', 'Benefits'], owners: ['Sponsor', 'PMO', 'Workstream leads', 'Benefits lead'] },
  'IT & infrastructure': { groups: ['Workplace', 'Infrastructure', 'Security', 'Service'], owners: ['IT lead', 'Infrastructure', 'Security', 'Service owner'] },
  'Software & product': { groups: ['Design', 'Engineering', 'Quality', 'Release'], owners: ['Design', 'Engineering', 'QA', 'Release lead'] },
  'Marketing & growth': { groups: ['Brand', 'Campaigns', 'Channels', 'Analytics'], owners: ['Brand lead', 'Campaign team', 'Channel lead', 'Analytics'] },
  Events: { groups: ['Program', 'Production', 'Audience', 'Operations'], owners: ['Event lead', 'Production', 'Communications', 'Operations'] },
  'Research & trials': { groups: ['Protocol', 'Sites', 'Research', 'Analysis'], owners: ['Study lead', 'Site lead', 'Research team', 'Analyst'] },
}

const CATEGORY_TASKS: Record<TemplateCategory, [string, string, string, string]> = {
  'Project delivery': ['Confirm user outcomes', 'Sequence the {focus} workplan', 'Complete delivery activities', 'Validate acceptance'],
  'Product roadmaps': ['Size the customer opportunity', 'Shape the {focus} concept', 'Build the priority increment', 'Release and measure adoption'],
  'Program management': ['Agree the {focus} outcomes', 'Baseline the program plan', 'Resolve cross-team dependencies', 'Review benefit measures'],
  'IT & infrastructure': ['Assess the current estate', 'Approve the {focus} design', 'Run the transition waves', 'Validate service readiness'],
  'Software & product': ['Refine the {focus} backlog', 'Prototype the key journeys', 'Integrate and test the build', 'Prepare the release'],
  'Marketing & growth': ['Set audience and targets', 'Develop the {focus} message', 'Activate campaign channels', 'Review reach and conversion'],
  Events: ['Confirm event outcomes', 'Book the {focus} program', 'Produce attendee experiences', 'Complete venue readiness'],
  'Research & trials': ['Approve the study protocol', 'Open {focus} recruitment', 'Complete research visits', 'Review and report findings'],
}

const LAYOUT_DESCRIPTIONS: Record<TimelineLayout, string> = {
  timeline: 'A focused delivery sequence with clear ownership and a finish point.',
  roadmap: 'Longer-horizon initiatives and releases arranged across workstreams.',
  swimlane: 'Parallel team lanes with overlapping work and visible handoffs.',
  portfolio: 'Cross-initiative portfolio lanes spanning multiple planning periods.',
  milestones: 'A checkpoint-led plan that makes reviews and decisions prominent.',
  event: 'A date-led run-up from early planning through event-day readiness.',
}

function getTemplateLayout(id: string, name: string, category: TemplateCategory): TimelineLayout {
  const identity = `${id} ${name}`.toLowerCase()
  if (/swimlane/.test(identity)) return 'swimlane'
  if (/portfolio/.test(identity)) return 'portfolio'
  if (/milestone|status|checkpoint|approval|readiness|evidence/.test(identity)) return 'milestones'
  if (category === 'Events') return 'event'
  if (category === 'Product roadmaps' || /roadmap|horizon|5 year/.test(identity)) return 'roadmap'
  if (category === 'Software & product') return 'swimlane'
  if (category === 'Program management') return 'portfolio'
  if (category === 'Research & trials') return 'milestones'
  return 'timeline'
}

const GENERATED_TEMPLATES: TimelineTemplate[] = CATALOG_ENTRIES.map(([id, name, category, focus]) => {
  const profile = CATEGORY_PROFILES[category]
  const layout = getTemplateLayout(id, name, category)
  const hasWorkstreamLanes = layout === 'swimlane' || layout === 'portfolio'
  const groups = hasWorkstreamLanes ? LANE_PROFILES[category].groups : profile.groups
  const owners = hasWorkstreamLanes ? LANE_PROFILES[category].owners : profile.owners
  const items: TemplateItem[] = []
  const addTask = (title: string, groupIndex: number, startOffset: number, duration: number, progress = 0) => items.push({
    title: title.replaceAll('{focus}', focus),
    kind: 'task',
    group: groups[groupIndex % groups.length],
    owner: owners[groupIndex % owners.length],
    startOffset,
    duration,
    progress,
  })
  const addMilestone = (title: string, groupIndex: number, startOffset: number) => items.push({
    title,
    kind: 'milestone',
    group: groups[groupIndex % groups.length],
    owner: owners[groupIndex % owners.length],
    startOffset,
    duration: 0,
    progress: 0,
  })
  const taskCopy = CATEGORY_TASKS[category]

  if (layout === 'swimlane') {
    groups.forEach((_lane, index) => {
      addTask(taskCopy[index], index, index * 12, 36 + (index % 2) * 10, index === 0 ? 45 : 0)
      addTask(`Coordinate ${focus} handoff`, index, 25 + index * 16, 24)
    })
    addMilestone(`${focus[0].toUpperCase()}${focus.slice(1)} integration`, groups.length - 1, 104)
  } else if (layout === 'portfolio') {
    groups.forEach((group, index) => {
      addTask(`${group}: ${focus} foundation`, index, index * 20, 420 + index * 30, index === 0 ? 30 : 0)
      addTask(`Scale ${focus} across ${group.toLowerCase()}`, index, 150 + index * 30, 360)
    })
    addMilestone(`${focus[0].toUpperCase()}${focus.slice(1)} benefits review`, groups.length - 1, 730)
  } else if (layout === 'roadmap') {
    taskCopy.forEach((copy, index) => addTask(copy, index, index * 90, 120 + (index % 2) * 60, index === 0 ? 20 : 0))
    addMilestone('Pilot release', Math.min(1, groups.length - 1), 180)
    addMilestone('Scale-up decision', groups.length - 1, 365)
  } else if (layout === 'milestones') {
    addMilestone('Scope and protocol approved', 0, 0)
    addTask(taskCopy[0], 0, 2, 26, 25)
    addTask(taskCopy[1], Math.min(1, groups.length - 1), 28, 34)
    addMilestone('Evidence review', Math.min(2, groups.length - 1), 66)
    addTask(taskCopy[2], Math.min(2, groups.length - 1), 68, 30)
    addTask(taskCopy[3], groups.length - 1, 98, 24)
    addMilestone('Decision and closeout', groups.length - 1, 126)
  } else if (layout === 'event') {
    taskCopy.forEach((copy, index) => addTask(copy, index, index * 9, 18 + (index % 2) * 8, index === 0 ? 50 : 0))
    addMilestone('Doors open', Math.min(2, groups.length - 1), 46)
    addMilestone('Event close', groups.length - 1, 49)
  } else {
    taskCopy.forEach((copy, index) => addTask(copy, index, index * 19, 22 + (index % 2) * 13, index === 0 ? 55 : 0))
    addMilestone(`${focus[0].toUpperCase()}${focus.slice(1)} complete`, groups.length - 1, 94)
  }
  return {
    id,
    name,
    category,
    layout,
    description: LAYOUT_DESCRIPTIONS[layout],
    groups,
    items,
  }
})

const BASE_CATEGORIES: Record<string, TemplateCategory> = {
  'product-launch': 'Project delivery',
  'quarterly-roadmap': 'Product roadmaps',
  'swimlane-plan': 'Project delivery',
  'milestone-map': 'Program management',
  blank: 'Project delivery',
}

export const TIMELINE_TEMPLATES: TimelineTemplate[] = [
  ...BASE_TIMELINE_TEMPLATES.map((template) => ({ ...template, category: BASE_CATEGORIES[template.id] })),
  ...GENERATED_TEMPLATES,
]

export const GALLERY_TEMPLATES = TIMELINE_TEMPLATES.filter((template) => template.id !== 'blank')

export function getProjectDateRange(project: TimelineProject) {
  const starts = [project.startDate, ...project.items.map((item) => item.startDate)]
  const ends = [project.endDate, ...project.items.map((item) => item.endDate)]
  return {
    startDate: starts.reduce((left, right) => left < right ? left : right),
    endDate: ends.reduce((left, right) => left > right ? left : right),
  }
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

export function isoWeekNumber(date: Date) {
  const thursday = addDays(startOfWeek(date), 3)
  const firstWeek = startOfWeek(new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4)))
  return Math.floor(daysBetween(firstWeek, startOfWeek(date)) / 7) + 1
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
  const rangeEnd = addDays(addMonths(startOfMonth(now), 5), -1)
  const createdAt = timestamp()
  return {
    version: 1,
    id: createId(),
    name,
    design: DEFAULT_TIMELINE_DESIGN,
    layout: 'timeline',
    presentation: 'timeline',
    startDate: rangeStart.toISOString().slice(0, 10),
    endDate: rangeEnd.toISOString().slice(0, 10),
    groups: [...GROUPS],
    items: [],
    templateId: 'blank',
    createdAt,
    updatedAt: createdAt,
  }
}

export function createProjectFromTemplate(templateId: TimelineTemplateId): TimelineProject {
  const template = TIMELINE_TEMPLATES.find((entry) => entry.id === templateId) ?? TIMELINE_TEMPLATES[0]
  const now = todayAsDate()
  const month = startOfMonth(now)
  const defaultStart = addMonths(month, -1)
  const defaultEnd = addDays(addMonths(month, 5), -1)
  const startOffset = Math.min(daysBetween(month, defaultStart), ...template.items.map((item) => item.startOffset))
  const endOffset = Math.max(daysBetween(month, defaultEnd), ...template.items.map((item) => item.startOffset + item.duration))
  const start = addDays(month, startOffset)
  const end = addDays(month, endOffset)
  const at = (offset: number) => addDays(month, offset).toISOString().slice(0, 10)
  const items = template.items.map(({ startOffset, duration, ...item }) => ({
    ...item,
    id: createId(),
    startDate: at(startOffset),
    endDate: at(startOffset + duration),
  }))
  const createdAt = timestamp()
  return {
    version: 1,
    id: createId(),
    name: template.id === 'blank' ? 'Untitled timeline' : template.name,
    design: DEFAULT_TIMELINE_DESIGN,
    layout: template.layout,
    presentation: getProjectPresentation({ layout: template.layout }),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    groups: [...template.groups],
    items,
    templateId: template.id,
    createdAt,
    updatedAt: createdAt,
  }
}

export function createSampleProject(): TimelineProject {
  return createProjectFromTemplate('product-launch')
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
  const template = TIMELINE_TEMPLATES.find((entry) => entry.id === value.templateId)
  const layouts: TimelineLayout[] = ['timeline', 'roadmap', 'swimlane', 'portfolio', 'milestones', 'event']
  const layout = layouts.includes(value.layout as TimelineLayout) ? value.layout as TimelineLayout : template?.layout ?? 'timeline'
  const presentation = value.presentation === 'timeline' || value.presentation === 'roadmap' || value.presentation === 'swimlane'
    ? value.presentation
    : getProjectPresentation({ layout })
  return {
    version: 1,
    id: value.id,
    name: value.name.trim() || 'Imported timeline',
    design: value.design === 'classic' || value.design === 'colorful' || value.design === 'minimal' ? value.design : DEFAULT_TIMELINE_DESIGN,
    layout,
    presentation,
    startDate: value.startDate,
    endDate: value.endDate,
    groups: [...new Set(groups)],
    items,
    ...(TIMELINE_TEMPLATES.some((template) => template.id === value.templateId) ? { templateId: value.templateId as TimelineTemplateId } : {}),
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

export function buildCsvTemplate() {
  const rows = [
    ['Name', 'Type', 'Workstream', 'Owner', 'Start date', 'End date', 'Progress'],
    ['Example task', 'task', 'Design', 'Project owner', '2026-11-02', '2026-11-13', '25'],
    ['Review milestone', 'milestone', 'Design', 'Project owner', '2026-11-16', '2026-11-16', '0'],
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
  const projectRange = getProjectDateRange(project)
  const start = getDate(projectRange.startDate)
  const end = addDays(getDate(projectRange.endDate), 1)
  const total = Math.max(1, daysBetween(start, end))
  const plotWidth = width - left - right
  const items = [...project.items].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const presentation = getProjectPresentation(project)
  const grouped = presentation === 'swimlane' || presentation === 'roadmap'
  const quarterView = presentation === 'roadmap'
  const laneGroups = [...new Set([...project.groups, ...items.map((item) => item.group)])].filter((group) => items.some((item) => item.group === group))
  const height = top + project.items.length * rowHeight + (grouped ? laneGroups.length * 38 : 0) + 56
  const ticks: string[] = []
  let cursor = quarterView
    ? new Date(Date.UTC(start.getUTCFullYear(), Math.floor(start.getUTCMonth() / 3) * 3, 1))
    : startOfMonth(start)
  for (; cursor < end; cursor = addMonths(cursor, quarterView ? 3 : 1)) {
    const x = Math.max(left, left + (daysBetween(start, cursor) / total) * plotWidth)
    const label = quarterView ? `Q${Math.floor(cursor.getUTCMonth() / 3) + 1} ${cursor.getUTCFullYear()}` : formatDate(cursor, { month: 'short', year: 'numeric' })
    ticks.push(`<line x1="${x}" y1="96" x2="${x}" y2="${height - 24}" stroke="#e5e9e5"/><text x="${x + 8}" y="112" fill="#52635e" font-size="13">${escapeXml(label)}</text>`)
  }
  const barHeight = project.design === 'minimal' ? 12 : 24
  const barRadius = project.design === 'colorful' ? 12 : project.design === 'minimal' ? 1 : 6
  const background = project.design === 'colorful' ? '#f6f9f6' : '#fbfcf9'
  const rows: string[] = []
  let cursorY = top
  const appendItem = (item: TimelineItem) => {
    const y = cursorY
    const x = left + (daysBetween(start, getDate(item.startDate)) / total) * plotWidth
    const duration = Math.max(1, daysBetween(getDate(item.startDate), addDays(getDate(item.endDate), 1)))
    const barWidth = Math.max(item.kind === 'milestone' ? 0 : 12, (duration / total) * plotWidth)
    const { main: color } = getTimelineGroupColors(project.groups, item.group, project.design)
    const mark = item.kind === 'milestone'
      ? `<path d="M ${x} ${y + 20} l 9 9 -9 9 -9 -9 Z" fill="${color}"/>`
      : `<rect x="${x}" y="${y + (rowHeight - barHeight) / 2}" width="${barWidth}" height="${barHeight}" rx="${barRadius}" fill="${color}"/><rect x="${x}" y="${y + (rowHeight - barHeight) / 2}" width="${barWidth * item.progress / 100}" height="${barHeight}" rx="${barRadius}" fill="#173f35" fill-opacity=".34"/>`
    rows.push(`<text x="32" y="${y + 32}" fill="#20302a" font-size="15" font-weight="600">${escapeXml(item.title)}</text><text x="32" y="${y + 51}" fill="#73817b" font-size="11">${escapeXml(item.group)} · ${escapeXml(item.owner || 'Unassigned')}</text>${mark}`)
    cursorY += rowHeight
  }
  if (grouped) {
    laneGroups.forEach((group) => {
      const colors = getTimelineGroupColors(project.groups, group, project.design)
      rows.push(`<rect x="16" y="${cursorY}" width="${width - 32}" height="32" fill="${colors.light}"/><rect x="16" y="${cursorY}" width="240" height="32" fill="${colors.main}"/><text x="30" y="${cursorY + 21}" fill="#ffffff" font-size="12" font-weight="700">${escapeXml(group)}</text>`)
      cursorY += 38
      items.filter((item) => item.group === group).forEach(appendItem)
    })
  } else {
    items.forEach(appendItem)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/><text x="32" y="52" fill="#20302a" font-family="Arial,sans-serif" font-size="28" font-weight="700">${escapeXml(project.name)}</text><text x="32" y="76" fill="#73817b" font-family="Arial,sans-serif" font-size="12">PROJECT TIMELINE · ${escapeXml(formatDate(project.startDate, { month: 'short', day: 'numeric', year: 'numeric' }))} — ${escapeXml(formatDate(project.endDate, { month: 'short', day: 'numeric', year: 'numeric' }))}</text>${ticks.join('')}${rows.join('')}</svg>`
}