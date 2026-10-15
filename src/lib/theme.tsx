import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'm365-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readPref(): ThemePref {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') return media.matches ? 'dark' : 'light'
  return pref
}

interface ThemeCtx {
  pref: ThemePref
  theme: 'light' | 'dark'
  setPref: (p: ThemePref) => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref)
  const [theme, setTheme] = useState(() => resolve(readPref()))

  useEffect(() => {
    const apply = () => setTheme(resolve(pref))
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [pref])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setPref = useCallback((p: ThemePref) => {
    if (p === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, p)
    setPrefState(p)
  }, [])

  return <Ctx.Provider value={{ pref, theme, setPref }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
