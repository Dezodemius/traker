import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { Workspace } from '@/pages/Workspace'
import { DesignSystem } from '@/pages/DesignSystem'
import { BRAND_NAME, BRAND_LOGO } from '@/lib/brand'

export default function App() {
  const { user, loading } = useAuth()
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen animate-pulse flex-col items-center justify-center gap-4 bg-background">
        <img src={BRAND_LOGO} alt={BRAND_NAME} className="size-16" />
        <div className="text-2xl font-black tracking-widest text-primary">{BRAND_NAME}</div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  if (route === '#design-system') {
    return (
      <DesignSystem
        onBack={() => {
          window.location.hash = ''
        }}
      />
    )
  }

  return (
    <Workspace
      userId={user.id}
      onOpenDesignSystem={() => {
        window.location.hash = 'design-system'
      }}
    />
  )
}
