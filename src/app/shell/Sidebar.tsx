import { Building2, LogOut } from 'lucide-react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useState, type FocusEvent, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { Morph, morphIcons } from '@/components/ui/Morph'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Session } from '@/features/auth/types'
import { useLogout } from '@/features/auth/useSession'
import { navigation } from '../navigation'

const onCoverButton =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-on-cover/80 transition-colors hover:bg-[oklch(1_0_0/0.08)] hover:text-on-cover'

/** "Global Administrator" reads as "Administrator": the sidebar keeps the role short. */
const shortRole = (role: string) => role.replace(/^global\s+/i, '')

interface Tip {
  text: string
  x: number
  y: number
}

/**
 * Labels for the collapsed rail. One fixed-position tooltip rendered outside the
 * scrolling nav, so it never widens the rail or adds a horizontal scrollbar.
 */
function useRailTip(enabled: boolean) {
  const [tip, setTip] = useState<Tip | null>(null)

  const bind = (text: string) => {
    if (!enabled) return {}
    const show = (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      setTip({ text, x: r.right + 12, y: r.top + r.height / 2 })
    }
    const hide = () => setTip(null)
    return { onMouseEnter: show, onFocus: show, onMouseLeave: hide, onBlur: hide }
  }

  const node =
    enabled && tip ? (
      <span
        role="tooltip"
        style={{ left: tip.x, top: tip.y }}
        className="pointer-events-none fixed z-[60] -translate-y-1/2 rounded-[var(--radius-paper)] bg-ink px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap text-paper shadow-[0_8px_24px_-8px_hsl(var(--shadow)/0.5)]"
      >
        {tip.text}
      </span>
    ) : null

  return { bind, node, hide: () => setTip(null) }
}

interface SidebarProps {
  session: Session
  layoutId: string
  rail?: boolean
  onToggleRail?: () => void
  onNavigate?: () => void
}

export function Sidebar({ session, layoutId, rail = false, onToggleRail, onNavigate }: SidebarProps) {
  const reduce = useReducedMotion()
  const logout = useLogout()
  const path = useLocation().pathname
  const { tenant, user } = session
  const tip = useRailTip(rail)

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-2 pt-5 pb-4 ${rail ? 'flex-col px-2' : 'px-5'}`}>
        {rail ? (
          <LogoMark className="size-9" />
        ) : (
          <div className="min-w-0 flex-1 text-on-cover">
            <Logo to="/dashboard" />
          </div>
        )}
        {onToggleRail && (
          <button
            type="button"
            onClick={() => {
              tip.hide()
              onToggleRail()
            }}
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!rail}
            title={`${rail ? 'Expand' : 'Collapse'} (Ctrl + B)`}
            className={onCoverButton}
          >
            <Morph icon={rail ? morphIcons.SidebarExpand : morphIcons.SidebarCollapse} size={20} />
          </button>
        )}
      </div>

      {/* the tenant this session acts on, always in view */}
      {rail ? (
        <div className="flex justify-center px-2 pb-3">
          <span
            tabIndex={0}
            aria-label={`Tenant: ${tenant.domain}`}
            className="grid size-10 place-items-center rounded-full text-on-cover/75"
            {...tip.bind(tenant.domain)}
          >
            <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
        </div>
      ) : (
        <div className="mx-3 mb-3 border-b border-[oklch(1_0_0/0.1)] px-3 pb-3">
          <p className="text-xs font-semibold tracking-wide text-on-cover/50 uppercase">Tenant</p>
          <p className="mt-0.5 truncate text-sm text-on-cover" title={tenant.domain}>
            {tenant.domain}
          </p>
        </div>
      )}

      <LayoutGroup id={layoutId}>
        <nav
          aria-label="Main"
          onScroll={tip.hide}
          className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-3 ${
            // the rail hides its scrollbar so icons stay centred under the logo
            rail ? 'px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'px-3'
          }`}
        >
          {navigation.map((group) => (
            <div key={group.id} className="border-t border-[oklch(1_0_0/0.1)] py-3 first:border-t-0 first:pt-1">
              {!rail && <p className="mb-1.5 pl-6 text-xs font-semibold tracking-wide text-on-cover/50 uppercase">{group.label}</p>}
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ label, path: to, icon: Icon }) => {
                  const active = path === to || path.startsWith(`${to}/`)
                  return (
                    <li key={to}>
                      <NavLink
                        to={to}
                        onClick={onNavigate}
                        aria-label={rail ? label : undefined}
                        {...tip.bind(label)}
                        className={`relative flex h-10 items-center gap-3 rounded-[var(--radius-paper)] text-[0.93rem] transition-colors ${
                          rail ? 'justify-center' : 'pr-3 pl-6'
                        } ${active ? 'bg-cover-2 font-semibold text-on-cover' : 'text-on-cover/75 hover:bg-[oklch(1_0_0/0.06)] hover:text-on-cover'}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-indicator"
                            transition={reduce ? { duration: 0 } : { type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            aria-hidden
                            className={`absolute inset-y-2 w-[3px] rounded-full bg-coral ${rail ? 'left-0' : 'left-2'}`}
                          />
                        )}
                        <Icon className={`size-[18px] shrink-0 ${active ? 'text-coral' : ''}`} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                        {!rail && <span className="truncate">{label}</span>}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </LayoutGroup>

      <div className={`border-t border-[oklch(1_0_0/0.1)] py-3 ${rail ? 'flex flex-col items-center gap-1 px-2' : 'flex items-center gap-2 px-3'}`}>
        <span
          tabIndex={rail ? 0 : undefined}
          aria-label={rail ? `${user.upn}, ${shortRole(user.role)}` : undefined}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-coral font-display text-sm font-bold text-on-coral"
          {...tip.bind(`${user.upn} · ${shortRole(user.role)}`)}
        >
          {user.upn.slice(0, 1).toUpperCase()}
        </span>
        {!rail && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-on-cover" title={user.upn}>
              {user.upn}
            </p>
            <span className="mt-1 inline-flex h-5 items-center rounded-full bg-[oklch(1_0_0/0.1)] px-2 text-[11px] font-semibold text-on-cover/85">
              {shortRole(user.role)}
            </span>
          </div>
        )}
        <ThemeToggle className="text-on-cover/80! hover:bg-[oklch(1_0_0/0.08)]! hover:text-on-cover!" />
        <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="Sign out" title="Sign out" className={onCoverButton}>
          <LogOut className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {tip.node}
    </div>
  )
}
