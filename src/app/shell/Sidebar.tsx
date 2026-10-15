import { clsx } from 'clsx'
import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router'
import type { Session } from '@/features/auth/types'
import { useLogout } from '@/features/auth/useSession'
import { navigation } from '../navigation'
import { BrandMark } from './BrandMark'
import { TenantBoard } from './TenantBoard'

interface SidebarProps {
  session: Session
  onNavigate?: () => void
}

export function Sidebar({ session, onNavigate }: SidebarProps) {
  const logout = useLogout()

  return (
    <div className="felt flex h-full flex-col text-letter-muted">
      <div className="flex h-15 shrink-0 items-center gap-2.5 px-5">
        <BrandMark />
        <span className="font-board text-[16px] font-bold tracking-[0.08em] text-letter uppercase">M365 Admin</span>
      </div>

      <TenantBoard tenant={session.tenant} />

      <nav aria-label="Main" className="mt-3 min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        {navigation.map((group) => (
          <div key={group.id} className="mt-4 first:mt-1">
            <h3 className="mb-1.5 flex items-center gap-2 px-2.5 font-board text-[11px] font-semibold tracking-[0.2em] uppercase">
              <span aria-hidden className="h-[3px] w-2.5" style={{ background: group.tick }} />
              {group.label}
            </h3>
            <ul>
              {group.items.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      clsx(
                        'group flex h-8.5 items-center gap-2.5 rounded-board px-2.5 text-[13.5px] transition-colors duration-150',
                        isActive
                          ? 'bg-letter font-semibold text-felt'
                          : 'text-letter/80 hover:bg-felt-raised hover:text-letter',
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                    <span className="truncate">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3 border-t border-felt-seam px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-letter" title={session.user.upn}>
            {session.user.displayName || session.user.upn}
          </p>
          <p className="font-board text-[11px] tracking-[0.12em] uppercase">{session.user.role}</p>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex h-8 items-center gap-1.5 rounded-board border border-felt-seam px-2.5 text-[12.5px] text-letter/85 transition-colors hover:border-danger hover:text-letter disabled:opacity-50"
        >
          <LogOut className="size-3.5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  )
}
