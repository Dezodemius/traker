/** @type {import('tailwindcss').Config} */

// Reads the oklch CSS variables declared in src/index.css and lets Tailwind's
// `/opacity` modifiers (bg-primary/15, border-border/60, ...) work on them —
// color-mix keeps the exact oklch values from the design without a manual
// channel-splitting step.
const token = (name) =>
  `color-mix(in oklch, var(${name}) calc(<alpha-value> * 100%), transparent)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: token('--background'),
        foreground: token('--foreground'),
        card: {
          DEFAULT: token('--card'),
          foreground: token('--card-foreground'),
        },
        popover: {
          DEFAULT: token('--popover'),
          foreground: token('--popover-foreground'),
        },
        primary: {
          DEFAULT: token('--primary'),
          foreground: token('--primary-foreground'),
        },
        secondary: {
          DEFAULT: token('--secondary'),
          foreground: token('--secondary-foreground'),
        },
        muted: {
          DEFAULT: token('--muted'),
          foreground: token('--muted-foreground'),
        },
        accent: {
          DEFAULT: token('--accent'),
          foreground: token('--accent-foreground'),
        },
        destructive: token('--destructive'),
        border: token('--border'),
        input: token('--input'),
        ring: token('--ring'),
        running: {
          DEFAULT: token('--running'),
          foreground: token('--running-foreground'),
        },
        paused: token('--paused'),
        'chart-1': token('--chart-1'),
        'chart-2': token('--chart-2'),
        'chart-3': token('--chart-3'),
        'chart-4': token('--chart-4'),
        'chart-5': token('--chart-5'),
      },
      borderRadius: {
        sm: 'calc(var(--radius) * 0.6)',
        md: 'calc(var(--radius) * 0.8)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) * 1.4)',
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.2)',
        '4xl': 'calc(var(--radius) * 2.6)',
      },
      fontFamily: {
        sans: [
          'Geist',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'Geist Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
