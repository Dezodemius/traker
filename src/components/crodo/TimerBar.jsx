import { Pause, Play, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, labelStyles } from '@/lib/crodo/types'

export function TimerBar({ store }) {
  const { activeTask, activeId, labels, liveElapsed, pauseActive } = store
  const label = activeTask ? labels.find((l) => l.id === activeTask.labelId) ?? null : null
  const s = label ? labelStyles[label.color] ?? labelStyles.slate : null

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors sm:gap-4 sm:px-4',
        activeId ? 'border-running/40 bg-running/10' : 'border-border bg-card',
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full',
          activeId ? 'bg-running text-running-foreground' : 'bg-secondary text-muted-foreground',
        )}
      >
        <Timer className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        {activeTask ? (
          <>
            <div className="flex items-center gap-2">
              {s && <span className={cn('size-2 shrink-0 rounded-full', s.dot)} />}
              <p className="truncate text-sm font-medium text-foreground">{activeTask.title}</p>
            </div>
            <p className="text-[11px] text-running">Часы идут</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">Часы на паузе</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Запусти задачу — остальные встанут на паузу
            </p>
          </>
        )}
      </div>

      <span
        className={cn(
          'font-mono text-xl tabular-nums sm:text-2xl',
          activeId ? 'text-running' : 'text-muted-foreground',
        )}
      >
        {activeTask ? formatDuration(liveElapsed(activeTask)) : '00:00'}
      </span>

      <button
        type="button"
        onClick={pauseActive}
        disabled={!activeId}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          activeId
            ? 'bg-running text-running-foreground hover:opacity-90'
            : 'cursor-not-allowed bg-secondary text-muted-foreground opacity-60',
        )}
      >
        {activeId ? (
          <>
            <Pause className="size-4 fill-current" />
            <span className="hidden sm:inline">Пауза</span>
          </>
        ) : (
          <>
            <Play className="size-4 fill-current" />
            <span className="hidden sm:inline">Стоп</span>
          </>
        )}
      </button>
    </div>
  )
}
