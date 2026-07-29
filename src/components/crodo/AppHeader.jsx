import { LogOut, SwatchBook } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BRAND_NAME, BRAND_TAGLINE, BRAND_LOGO } from '@/lib/brand'
import { formatCompact } from '@/lib/crodo/types'
import { ThemeToggle } from './ThemeToggle'

export function AppHeader({ store, onOpenDesignSystem }) {
  const activeCount = store.tasks.filter(
    (t) => !store.columns.find((c) => c.id === t.columnId)?.isDone,
  ).length

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <img src={BRAND_LOGO} alt={BRAND_NAME} className="size-9 rounded-lg" />
        <div className="leading-none">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{BRAND_NAME}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{BRAND_TAGLINE}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-right">
        <div className="hidden sm:block">
          <p className="font-mono text-sm tabular-nums text-foreground">
            {formatCompact(store.totalTrackedMs)}
          </p>
          <p className="text-[11px] text-muted-foreground">всего времени</p>
        </div>
        <div>
          <p className="font-mono text-sm tabular-nums text-foreground">{activeCount}</p>
          <p className="text-[11px] text-muted-foreground">в работе</p>
        </div>
        <button
          type="button"
          onClick={onOpenDesignSystem}
          aria-label="Дизайн-система"
          className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <SwatchBook className="size-4" />
        </button>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          aria-label="Выйти"
          className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}
