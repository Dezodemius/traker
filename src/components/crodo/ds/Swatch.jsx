import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

function rgbToHex(rgb) {
  const m = rgb.match(/\d+(\.\d+)?/g)
  if (!m || m.length < 3) return rgb
  const [r, g, b] = m.slice(0, 3).map((n) => Math.round(Number(n)))
  const hex = (n) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
}

/**
 * Reads the live computed value of a design token for the ACTIVE theme
 * and displays it as a hex code, so the same swatch stays accurate when
 * the user flips between the light and dark palettes.
 */
export function Swatch({ token, name, usage, onDark }) {
  const ref = useRef(null)
  const [hex, setHex] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setHex(rgbToHex(getComputedStyle(el).backgroundColor))
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={ref}
        style={{ backgroundColor: `var(${token})` }}
        className={cn('h-16 w-full rounded-lg border', onDark ? 'border-white/10' : 'border-border')}
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{hex || token}</p>
        {usage && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{usage}</p>}
      </div>
    </div>
  )
}
