import { Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/features/auth/useSession'
import { findNavItem } from '../navigation'
import { ApiStatusPill } from './ApiStatusPill'
import { BrandMark } from './BrandMark'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

export function AppShell() {
  const { data: session, isPending, isError } = useSession()
  const location = useLocation()
  const [railOpen, setRailOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (isPending) return <ShellLoading />
  if (isError || !session) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  const current = findNavItem(location.pathname)

  return (
    <div className="grid min-h-dvh lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar session={session} />
      </aside>

      {railOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-felt/60" onClick={() => setRailOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(288px,85vw)] shadow-[8px_0_32px_rgb(0_0_0/0.35)]">
            <Sidebar session={session} onNavigate={() => setRailOpen(false)} />
            <button
              type="button"
              onClick={() => setRailOpen(false)}
              aria-label="Close menu"
              className="absolute top-3.5 right-3 grid size-8 place-items-center rounded-board text-letter/80 hover:text-letter"
            >
              <X className="size-4" aria-hidden />
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-line bg-ground/92 px-4 backdrop-blur-sm sm:px-8">
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-board border border-line text-ink lg:hidden"
          >
            <Menu className="size-4" aria-hidden />
          </button>
          <span className="lg:hidden">
            <BrandMark size={24} />
          </span>

          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="truncate font-board text-[22px] font-bold tracking-[0.04em] uppercase">{current?.label ?? 'Not found'}</h1>
            {current && (
              <span className="hidden items-center gap-1.5 font-board text-[12px] font-semibold tracking-[0.16em] text-ink-faint uppercase sm:flex">
                <span aria-hidden className="h-[3px] w-2.5" style={{ background: current.group.tick }} />
                {current.group.label}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ApiStatusPill className="hidden md:inline-flex" />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 items-center gap-2 rounded-board border border-line bg-surface px-3 text-[13px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded-[3px] border border-line px-1.5 font-board text-[11px] tracking-wider sm:inline">Ctrl K</kbd>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-7">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}

function ShellLoading() {
  return (
    <div className="felt grid min-h-dvh place-items-center">
      <div role="status" className="flex flex-col items-center gap-4">
        <BrandMark size={36} />
        <span className="font-board text-[12px] font-semibold tracking-[0.2em] text-letter-muted uppercase">Opening session…</span>
      </div>
    </div>
  )
}
