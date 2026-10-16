import { useSyncExternalStore } from 'react'

// Same mechanism as Family Photos: a `dark` class on <html>, preference in localStorage.
export type ThemePref = 'light' | 'dark' | 'system'

const KEY = 'm365-theme'

const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

export function setThemePref(pref: ThemePref) {
  if (pref === 'system') localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, pref)
  document.documentElement.classList.toggle('dark', pref === 'dark' || (pref === 'system' && systemDark()))
}

/** Flip between light and dark from whatever is showing now. */
export function toggleTheme() {
  setThemePref(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
}

// Follows the class on <html>, so every toggle on the page stays in step.
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => mo.disconnect()
}

export function useIsDark() {
  return useSyncExternalStore(subscribe, () => document.documentElement.classList.contains('dark'))
}
