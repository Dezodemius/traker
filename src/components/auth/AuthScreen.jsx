import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BRAND_NAME, BRAND_TAGLINE, BRAND_LOGO } from '@/lib/brand'

const TEXT = {
  accountCreated: 'Аккаунт создан. Если включено подтверждение почты, завершите его через письмо.',
  login: 'Вход',
  signup: 'Регистрация',
  signIn: 'Войти',
  signUp: 'Зарегистрироваться',
  password: 'Пароль',
  orVia: 'Или через',
}

export function AuthScreen() {
  const [authMode, setAuthMode] = useState('login')

  const handleEmailAuth = async (e, type) => {
    e.preventDefault()

    const email = e.target.email.value
    const password = e.target.password.value

    const { error } =
      type === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      alert(error.message)
      return
    }

    if (type === 'signup') {
      alert(TEXT.accountCreated)
      setAuthMode('login')
      e.target.reset()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="mx-auto mb-4 h-16 w-16" />
          <h1 className="text-3xl font-black tracking-tighter text-primary">{BRAND_NAME}</h1>
          <p className="mt-1 text-sm italic text-muted-foreground">{BRAND_TAGLINE}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
              authMode === 'login'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TEXT.login}
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
              authMode === 'signup'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TEXT.signup}
          </button>
        </div>

        <form onSubmit={(e) => handleEmailAuth(e, authMode)} className="mb-6 space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-secondary-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="password"
              type="password"
              placeholder={TEXT.password}
              minLength={6}
              className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-secondary-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 active:scale-[0.99]"
          >
            {authMode === 'login' ? TEXT.signIn : TEXT.signUp}
          </button>
        </form>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {TEXT.orVia}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="flex items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="size-4" />
            Google
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
            className="flex items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>
      </div>
    </div>
  )
}
