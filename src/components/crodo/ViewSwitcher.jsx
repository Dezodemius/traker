import { LayoutGrid, Columns3, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export const VIEWS = [
  { key: 'bento', label: 'Bento', icon: LayoutGrid },
  { key: 'kanban', label: 'Канбан', icon: Columns3 },
  { key: 'list', label: 'Список', icon: List },
]

export function ViewSwitcher({ view, onChange }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-background/80 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {VIEWS.map((v) => {
          const Icon = v.icon
          const active = view === v.key
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => onChange(v.key)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
