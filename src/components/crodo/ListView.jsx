import { cn } from '@/lib/utils'
import { formatDuration, labelStyles } from '@/lib/crodo/types'
import { TimerButton } from './TaskCard'

export function ListView({ store }) {
  const { tasks, columns, labels, activeId, liveElapsed, toggleTask, moveTask } = store

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Пока нет задач — добавьте первую выше
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
        <span className="w-8" />
        <span>Задача</span>
        <span>Метка</span>
        <span className="text-right">Время</span>
        <span className="text-right">Статус</span>
      </div>

      <ul className="divide-y divide-border">
        {tasks.map((task) => {
          const label = labels.find((l) => l.id === task.labelId) ?? null
          const column = columns.find((c) => c.id === task.columnId)
          const running = activeId === task.id
          const s = label ? labelStyles[label.color] ?? labelStyles.slate : null

          return (
            <li
              key={task.id}
              className={cn(
                'grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4',
                running ? 'bg-running/5' : 'hover:bg-secondary/40',
              )}
            >
              <TimerButton
                running={running}
                disabled={column?.isDone}
                size="sm"
                onClick={() => toggleTask(task.id)}
              />

              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate text-sm font-medium text-card-foreground',
                    column?.isDone && 'text-muted-foreground line-through',
                  )}
                >
                  {task.title}
                </p>
                <p className="truncate text-xs text-muted-foreground sm:hidden">
                  {label?.name ?? '—'} · {formatDuration(liveElapsed(task))}
                </p>
              </div>

              <div className="hidden sm:block">
                {label && s ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('size-2 rounded-full', s.dot)} />
                    {label.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              <span
                className={cn(
                  'hidden text-right font-mono text-sm tabular-nums sm:block',
                  running ? 'text-running' : 'text-muted-foreground',
                )}
              >
                {formatDuration(liveElapsed(task))}
              </span>

              <div className="col-span-2 flex justify-end sm:col-span-1">
                <select
                  aria-label="Переместить задачу"
                  value={task.columnId}
                  onChange={(e) => moveTask(task.id, e.target.value)}
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
