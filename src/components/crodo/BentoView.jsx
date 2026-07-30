import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCompact } from '@/lib/crodo/types'
import { TaskCard } from './TaskCard'

const groupOptions = [
  { key: 'group', label: 'По проекту' },
  { key: 'labelId', label: 'По метке' },
  { key: 'priority', label: 'По приоритету' },
  { key: 'columnId', label: 'По статусу' },
]

const priorityNames = {
  high: 'Высокий приоритет',
  medium: 'Средний приоритет',
  low: 'Низкий приоритет',
}

export function BentoView({ store }) {
  const { tasks, columns, labels, activeId, liveElapsed, toggleTask, moveTask } = store

  const [groupBy, setGroupBy] = useState('group')

  const resolveName = (key, value) => {
    if (key === 'labelId') return labels.find((l) => l.id === value)?.name ?? 'Без метки'
    if (key === 'columnId') return columns.find((c) => c.id === value)?.name ?? value
    if (key === 'priority') return priorityNames[value] ?? value
    return value
  }

  const groups = useMemo(() => {
    const map = new Map()
    for (const task of tasks) {
      const raw = task[groupBy]
      const value = raw == null || raw === '' ? 'none' : String(raw)
      if (!map.has(value)) map.set(value, [])
      map.get(value).push(task)
    }
    return Array.from(map.entries()).map(([value, items]) => ({
      value,
      name: value === 'none' ? 'Без группы' : resolveName(groupBy, value),
      items,
      total: items.reduce((s, t) => s + liveElapsed(t), 0),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, groupBy, labels, columns, liveElapsed])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Layers className="size-3.5" />
          Группировка
        </span>
        {groupOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setGroupBy(opt.key)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              groupBy === opt.key
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Пока нет задач — добавьте первую выше
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group, i) => {
          const wide = groups.length > 2 && i % 5 === 0
          return (
            <section
              key={group.value}
              className={cn(
                'flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-4',
                wide && 'md:col-span-2',
              )}
            >
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-card-foreground">{group.name}</h2>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 tabular-nums">
                    {group.items.length}
                  </span>
                  <span className="font-mono tabular-nums">{formatCompact(group.total)}</span>
                </div>
              </header>

              <div className={cn('grid gap-3', wide ? 'sm:grid-cols-2' : 'grid-cols-1')}>
                {group.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    label={labels.find((l) => l.id === task.labelId) ?? null}
                    columns={columns}
                    running={activeId === task.id}
                    elapsedMs={liveElapsed(task)}
                    onToggle={() => toggleTask(task.id)}
                    onMove={(columnId) => moveTask(task.id, columnId)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
