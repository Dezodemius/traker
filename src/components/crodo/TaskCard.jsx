import { Pause, Play, Flag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, labelStyles, priorityMeta } from '@/lib/crodo/types'

export function TimerButton({ running, onClick, disabled, size = 'md' }) {
  const dim = size === 'sm' ? 'size-8' : 'size-10'
  const icon = size === 'sm' ? 'size-3.5' : 'size-4'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={running ? 'Поставить на паузу' : 'Запустить таймер'}
      aria-pressed={running}
      className={cn(
        'grid shrink-0 place-items-center rounded-full border transition-colors',
        dim,
        disabled && 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50',
        !disabled &&
          running &&
          'border-running/40 bg-running text-running-foreground shadow-[0_0_0_4px] shadow-running/15',
        !disabled &&
          !running &&
          'border-border bg-secondary text-foreground hover:border-primary/50 hover:text-primary',
      )}
    >
      {running ? (
        <Pause className={cn(icon, 'fill-current')} />
      ) : (
        <Play className={cn(icon, 'translate-x-px fill-current')} />
      )}
    </button>
  )
}

export function LabelChip({ label }) {
  const s = labelStyles[label.color] ?? labelStyles.slate
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        s.chip,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {label.name}
    </span>
  )
}

export function TaskCard({ task, label, columns, running, elapsedMs, onToggle, onMove, onDelete }) {
  const column = columns.find((c) => c.id === task.columnId)
  const isDone = column?.isDone
  const priority = priorityMeta[task.priority]

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border bg-card p-3.5 transition-colors',
        running ? 'border-running/50 ring-1 ring-running/30' : 'border-border hover:border-primary/30',
      )}
    >
      {running && (
        <span className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-[11px] font-medium text-running">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-running opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-running" />
          </span>
          идёт
        </span>
      )}

      <div className="flex items-center gap-2 pr-14">
        {label && <LabelChip label={label} />}
        <span className={cn('inline-flex items-center gap-1 text-[11px]', priority.className)}>
          <Flag className="size-3" />
          {priority.label}
        </span>
      </div>

      <div className="min-w-0">
        <h3
          className={cn(
            'text-pretty text-sm font-medium leading-snug text-card-foreground',
            isDone && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </h3>
        {task.note && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {task.note}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2.5">
          <TimerButton running={running} disabled={isDone} size="sm" onClick={onToggle} />
          <span
            className={cn(
              'font-mono text-sm tabular-nums',
              running ? 'text-running' : 'text-muted-foreground',
            )}
          >
            {formatDuration(elapsedMs)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Переместить задачу"
            value={task.columnId}
            onChange={(e) => onMove(e.target.value)}
            className="max-w-[8rem] truncate rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Удалить задачу «${task.title}»?`)) {
                  onDelete()
                }
              }}
              aria-label="Удалить задачу"
              className="grid shrink-0 place-items-center rounded-md border border-border bg-secondary p-1 text-secondary-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
