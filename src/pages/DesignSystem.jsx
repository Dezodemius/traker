import { ArrowLeft, Type, Palette, Square, Component } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/crodo/ThemeToggle'
import { Swatch } from '@/components/crodo/ds/Swatch'
import { TaskCard, TimerButton, LabelChip } from '@/components/crodo/TaskCard'
import { DEFAULT_COLUMNS } from '@/lib/crodo/types'

const demoColumns = DEFAULT_COLUMNS.map((c) => ({ id: c.slug, name: c.name, isDone: c.isDone }))

const demoLabels = [
  { id: 'l1', name: 'Дизайн', color: 'amber' },
  { id: 'l2', name: 'Разработка', color: 'green' },
  { id: 'l3', name: 'Ресёрч', color: 'blue' },
  { id: 'l4', name: 'Баг', color: 'rose' },
  { id: 'l5', name: 'Бэклог', color: 'slate' },
]

function Section({ id, icon: Icon, title, desc, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-10 first:border-t-0">
      <div className="mb-6 flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {desc && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

const nav = [
  { id: 'themes', label: 'Темы' },
  { id: 'colors', label: 'Цвета' },
  { id: 'type', label: 'Типографика' },
  { id: 'radius', label: 'Скругления' },
  { id: 'components', label: 'Компоненты' },
]

const noop = () => {}

export function DesignSystem({ onBack }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Назад к приложению"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <p className="text-sm font-semibold tracking-tight">КРОДО · Дизайн-система</p>
              <p className="text-[11px] text-muted-foreground">Токены, типографика и компоненты</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 md:px-6">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-running" />
            Живой гайд · переключай тему кнопкой сверху
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Дизайн-система КРОДО
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            Единый набор токенов и компонентов для трекера задач с механикой шахматных часов.
            Две палитры: светлый «Премиальный бумажный крафт» и тёмный «Фокус и Драйв».
            Значения свотчей читаются вживую и меняются вместе с темой.
          </p>
        </div>

        <Section
          id="themes"
          icon={Palette}
          title="Две темы"
          desc="Обе палитры построены на одних и тех же токенах — компоненты не знают, какая тема активна."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#F4F3EF] ring-1 ring-black/10" />
                <span className="size-3 rounded-full bg-[#D97706]" />
                <span className="size-3 rounded-full bg-[#16A34A]" />
              </div>
              <h3 className="mt-3 font-semibold">Премиальный бумажный крафт</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Светлая. Фон цвета слоновой кости, чисто белые карточки с мягкой тенью,
                карамельный янтарь и насыщенный изумруд. Легко, но контрастно.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#0F1115] ring-1 ring-white/15" />
                <span className="size-3 rounded-full bg-[#FFB300]" />
                <span className="size-3 rounded-full bg-[#00E676]" />
              </div>
              <h3 className="mt-3 font-semibold">Фокус и Драйв</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Тёмная. Глубокий графит, панели с синеватым отливом, тёплый янтарь и
                неоновый Spring Green для тикающей задачи. Акценты «горят», но не слепят.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="colors"
          icon={Palette}
          title="Цветовые токены"
          desc="Все цвета заданы через CSS-переменные в index.css. Используй семантические классы (bg-primary, text-running), а не прямые цвета."
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Поверхности
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Swatch token="--background" name="background" usage="Фон приложения" />
                <Swatch token="--card" name="card" usage="Карточки, панели" />
                <Swatch token="--secondary" name="secondary" usage="Кнопки, поля" />
                <Swatch token="--muted" name="muted" usage="Приглушённый фон" />
                <Swatch token="--border" name="border" usage="Границы" />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Текст
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Swatch token="--foreground" name="foreground" usage="Основной текст" />
                <Swatch token="--muted-foreground" name="muted-foreground" usage="Второстепенный" />
                <Swatch token="--card-foreground" name="card-foreground" usage="Текст на карточке" />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Акценты и состояния
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Swatch token="--primary" name="primary" usage="Янтарь · действия" />
                <Swatch token="--running" name="running" usage="Активный таймер" />
                <Swatch token="--destructive" name="destructive" usage="Удаление, ошибки" />
                <Swatch token="--paused" name="paused" usage="Пауза" />
                <Swatch token="--ring" name="ring" usage="Фокус-кольцо" />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Палитра меток и графиков
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Swatch token="--chart-1" name="chart-1" usage="amber" />
                <Swatch token="--chart-2" name="chart-2" usage="green" />
                <Swatch token="--chart-3" name="chart-3" usage="blue" />
                <Swatch token="--chart-4" name="chart-4" usage="rose" />
                <Swatch token="--chart-5" name="chart-5" usage="slate" />
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="type"
          icon={Type}
          title="Типографика"
          desc="Две гарнитуры: Geist для интерфейса и Geist Mono для времени и токенов. Межстрочный интервал для текста — leading-relaxed."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Geist Sans · интерфейс">
              <div className="space-y-3 font-sans">
                <p className="text-3xl font-semibold tracking-tight">Заголовок H1 · 30px</p>
                <p className="text-lg font-semibold">Подзаголовок · 18px</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Основной текст 14px с интервалом leading-relaxed — комфортно для длинных описаний задач и заметок.
                </p>
                <p className="text-xs text-muted-foreground">Подпись · 12px</p>
              </div>
            </Panel>
            <Panel title="Geist Mono · время и данные">
              <div className="space-y-3 font-mono tabular-nums">
                <p className="text-3xl text-running">52:01</p>
                <p className="text-xl text-foreground">1:24:38</p>
                <p className="text-sm text-muted-foreground">--primary · oklch(0.8 0.16 78)</p>
              </div>
            </Panel>
          </div>
        </Section>

        <Section
          id="radius"
          icon={Square}
          title="Скругления"
          desc="Базовый радиус --radius = 0.625rem, остальные ступени вычисляются от него."
        >
          <div className="flex flex-wrap gap-4">
            {[
              { c: 'rounded-md', l: 'md' },
              { c: 'rounded-lg', l: 'lg' },
              { c: 'rounded-xl', l: 'xl' },
              { c: 'rounded-2xl', l: '2xl' },
              { c: 'rounded-full', l: 'full' },
            ].map((r) => (
              <div key={r.l} className="flex flex-col items-center gap-2">
                <div className={`size-16 border border-border bg-card ${r.c}`} />
                <span className="font-mono text-[11px] text-muted-foreground">{r.l}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="components"
          icon={Component}
          title="Компоненты"
          desc="Готовые элементы интерфейса, собранные на токенах. Всё автоматически адаптируется под активную тему."
        >
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Кнопки">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Основная</Button>
                  <Button variant="secondary">Вторичная</Button>
                  <Button variant="outline">Контурная</Button>
                  <Button variant="ghost">Призрачная</Button>
                  <Button variant="destructive">Удалить</Button>
                </div>
              </Panel>
              <Panel title="Кнопка таймера · состояния">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <TimerButton running={false} onClick={noop} />
                    <span className="text-[11px] text-muted-foreground">пауза</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <TimerButton running onClick={noop} />
                    <span className="text-[11px] text-muted-foreground">идёт</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <TimerButton running={false} disabled onClick={noop} />
                    <span className="text-[11px] text-muted-foreground">готово</span>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Метки">
                <div className="flex flex-wrap gap-2">
                  {demoLabels.map((l) => (
                    <LabelChip key={l.id} label={l} />
                  ))}
                </div>
              </Panel>
              <Panel title="Приоритеты">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-destructive">● Высокий</span>
                  <span className="text-primary">● Средний</span>
                  <span className="text-muted-foreground">● Низкий</span>
                </div>
              </Panel>
            </div>

            <Panel title="Карточка задачи">
              <div className="grid gap-4 sm:grid-cols-3">
                <TaskCard
                  task={{
                    id: 'd1',
                    title: 'Свёрстать экран онбординга',
                    note: '3 шага, свайпы на мобилке',
                    columnId: 'doing',
                    labelId: 'l1',
                    priority: 'high',
                  }}
                  label={demoLabels[0]}
                  columns={demoColumns}
                  running={false}
                  elapsedMs={3121000}
                  onToggle={noop}
                  onMove={noop}
                />
                <TaskCard
                  task={{
                    id: 'd2',
                    title: 'Компонент шахматных часов',
                    note: 'одна задача активна, остальные на паузе',
                    columnId: 'doing',
                    labelId: 'l2',
                    priority: 'medium',
                  }}
                  label={demoLabels[1]}
                  columns={demoColumns}
                  running
                  elapsedMs={372000}
                  onToggle={noop}
                  onMove={noop}
                />
                <TaskCard
                  task={{
                    id: 'd3',
                    title: 'Гайд по бренду',
                    columnId: 'done',
                    labelId: 'l1',
                    priority: 'low',
                  }}
                  label={demoLabels[0]}
                  columns={demoColumns}
                  running={false}
                  elapsedMs={8400000}
                  onToggle={noop}
                  onMove={noop}
                />
              </div>
            </Panel>

            <Panel title="Поля ввода">
              <div className="flex flex-wrap gap-3">
                <input
                  placeholder="Название задачи…"
                  className="w-56 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                <select
                  defaultValue="doing"
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {demoColumns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Panel>
          </div>
        </Section>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          КРОДО · Дизайн-система построена на дизайн-токенах index.css
        </footer>
      </div>
    </main>
  )
}
