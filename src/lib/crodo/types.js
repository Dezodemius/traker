export const LABEL_COLORS = ['amber', 'green', 'blue', 'rose', 'slate']

/** tailwind utility fragments for each accent, kept theme-safe */
export const labelStyles = {
  amber: {
    dot: 'bg-primary',
    chip: 'bg-primary/15 text-primary border-primary/30',
    ring: 'ring-primary/40',
  },
  green: {
    dot: 'bg-running',
    chip: 'bg-running/15 text-running border-running/30',
    ring: 'ring-running/40',
  },
  blue: {
    dot: 'bg-chart-3',
    chip: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
    ring: 'ring-chart-3/40',
  },
  rose: {
    dot: 'bg-chart-4',
    chip: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
    ring: 'ring-chart-4/40',
  },
  slate: {
    dot: 'bg-muted-foreground',
    chip: 'bg-muted text-muted-foreground border-border',
    ring: 'ring-muted-foreground/40',
  },
}

export const priorityMeta = {
  high: { label: 'Высокий', className: 'text-destructive' },
  medium: { label: 'Средний', className: 'text-primary' },
  low: { label: 'Низкий', className: 'text-muted-foreground' },
}

/** defaults used when a workspace has no columns/labels yet (new signup) */
export const DEFAULT_COLUMNS = [
  { slug: 'backlog', name: 'Бэклог', isDone: false },
  { slug: 'today', name: 'На сегодня', isDone: false },
  { slug: 'doing', name: 'В работе', isDone: false },
  { slug: 'done', name: 'Готово', isDone: true },
]

export const DEFAULT_LABELS = [
  { slug: 'design', name: 'Дизайн', color: 'amber' },
  { slug: 'dev', name: 'Разработка', color: 'green' },
  { slug: 'research', name: 'Ресёрч', color: 'blue' },
  { slug: 'bug', name: 'Баг', color: 'rose' },
]

export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  const pad = (n) => n.toString().padStart(2, '0')
  if (h > 0) return `${h}:${pad(mm)}:${pad(ss)}`
  return `${pad(mm)}:${pad(ss)}`
}

export function formatCompact(ms) {
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const mm = totalMinutes % 60
  if (h > 0) return `${h}ч ${mm}м`
  if (mm > 0) return `${mm}м`
  return '0м'
}
