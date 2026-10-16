import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

export interface PopoverPosition {
  left: number
  top?: number
  bottom?: number
  minWidth: number
  maxHeight: number
}

/**
 * Places a fixed-position popover under its trigger (or above it near the
 * bottom edge), follows scroll/resize, and closes on outside pointer down.
 * Fixed positioning keeps it visible inside scrolling dialogs and tables.
 */
export function usePopover(open: boolean, onClose: () => void, maxHeight = 320) {
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const [pos, setPos] = useState<PopoverPosition | null>(null)

  useLayoutEffect(() => {
    if (!open || !trigger.current) return
    const place = () => {
      const r = trigger.current!.getBoundingClientRect()
      const below = window.innerHeight - r.bottom - 12
      const above = r.top - 12
      const up = below < 220 && above > below
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 200) - 8)),
        minWidth: r.width,
        maxHeight: Math.min(maxHeight, up ? above : below),
        ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, maxHeight])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!trigger.current?.contains(t) && !panel.current?.contains(t)) onClose()
    }
    // Esc closes only the list. Captured before a surrounding <dialog> sees it,
    // otherwise the whole dialog (and the operator's input) would close.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      onClose()
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose])

  const style = pos ? { left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight } : undefined
  return { trigger: trigger as RefObject<HTMLButtonElement>, panel, style, ready: Boolean(pos) }
}
