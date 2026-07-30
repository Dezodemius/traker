import { useState } from 'react'
import { Plus } from 'lucide-react'
import { priorityMeta } from '@/lib/crodo/types'

export function QuickAdd({ store }) {
  const { columns, labels, groupNames, addTask } = store
  const [title, setTitle] = useState('')
  const [labelId, setLabelId] = useState('')
  const [columnId, setColumnId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [group, setGroup] = useState('')

  const activeColumnId = columnId || columns[0]?.id || 'today'
  const activeLabelId = labelId || labels[0]?.id || ''

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    addTask({
      title: trimmed,
      labelId: activeLabelId || null,
      columnId: activeColumnId,
      priority,
      group: group.trim(),
    })
    setTitle('')
    setGroup('')
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2 px-1">
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return
            if (e.key === 'Enter') submit()
          }}
          placeholder="Новая задача…"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Метка"
          value={activeLabelId}
          onChange={(e) => setLabelId(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
        >
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Столбец"
          value={activeColumnId}
          onChange={(e) => setColumnId(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          list="crodo-group-options"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Группа (необязательно)…"
          className="flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
        />
        <datalist id="crodo-group-options">
          {groupNames.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <select
          aria-label="Приоритет"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
        >
          {Object.entries(priorityMeta).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Добавить
        </button>
      </div>
    </div>
  )
}
