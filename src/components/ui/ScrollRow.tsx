import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * One horizontal row that scrolls when its content does not fit.
 * Hidden edges fade out, and arrow buttons appear on the side that has more,
 * so nothing is ever silently cut off. Touch devices simply swipe.
 */
export function ScrollRow({ children, className = '', label }: { children: ReactNode; className?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [measure])

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: 'smooth' })

  const fade = `linear-gradient(to right, ${edges.left ? 'transparent, black 40px' : 'black'}, ${edges.right ? 'black calc(100% - 40px), transparent' : 'black'})`

  const arrow =
    'absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper text-ink-2 shadow-[0_4px_12px_-4px_hsl(var(--shadow)/0.35)] transition-colors hover:text-ink [@media(pointer:fine)]:grid'

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div
        ref={ref}
        onScroll={measure}
        aria-label={label}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max items-center gap-1">{children}</div>
      </div>
      {edges.left && (
        <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className={`${arrow} left-0`}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      {edges.right && (
        <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className={`${arrow} right-0`}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
