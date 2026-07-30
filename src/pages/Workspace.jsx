import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { useCrodoStore } from '@/hooks/useCrodoStore'
import { AppHeader } from '@/components/crodo/AppHeader'
import { ViewSwitcher } from '@/components/crodo/ViewSwitcher'
import { TimerBar } from '@/components/crodo/TimerBar'
import { QuickAdd } from '@/components/crodo/QuickAdd'
import { BentoView } from '@/components/crodo/BentoView'
import { KanbanView } from '@/components/crodo/KanbanView'
import { ListView } from '@/components/crodo/ListView'

export function Workspace({ userId }) {
  const store = useCrodoStore(userId)
  const [view, setView] = useState(() => localStorage.getItem('crodo:view') || 'bento')

  useEffect(() => {
    localStorage.setItem('crodo:view', view)
  }, [view])

  if (store.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Загрузка…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Analytics />
      <SpeedInsights />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex flex-col gap-4">
          <AppHeader store={store} />
          <TimerBar store={store} />
          <QuickAdd store={store} />
        </header>

        <ViewSwitcher view={view} onChange={setView} />

        <main className="flex-1 pb-6">
          {view === 'bento' && <BentoView store={store} />}
          {view === 'kanban' && <KanbanView store={store} />}
          {view === 'list' && <ListView store={store} />}
        </main>
      </div>
    </div>
  )
}
