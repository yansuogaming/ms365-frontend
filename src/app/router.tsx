import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { allNavItems } from './navigation'
import { ModulePending } from './ModulePending'
import { ScreenLoader } from '@/components/ui/Loader'
import { AppShell } from './shell/AppShell'

/**
 * Feature pages register here as they are built, e.g.
 *   { path: 'identity/users', lazy: () => import('@/features/users/route') }
 * Every nav entry without a page falls back to ModulePending.
 */
const builtRoutes: { path: string; lazy: () => Promise<{ Component: React.ComponentType }> }[] = [
  { path: 'dashboard', lazy: () => import('@/features/dashboard/route') },
  { path: 'identity/users', lazy: () => import('@/features/users/route') },
  { path: 'identity/groups', lazy: () => import('@/features/groups/route') },
  { path: 'billing/products', lazy: () => import('@/features/products/route') },
]

const built = new Set(builtRoutes.map((r) => `/${r.path}`))

export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    Component: AppShell,
    // first load straight onto a lazy page, before its code has arrived
    HydrateFallback: () => <ScreenLoader label="Loading…" />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...builtRoutes,
      ...allNavItems.filter((i) => !built.has(i.path)).map((i) => ({ path: i.path.slice(1), Component: ModulePending })),
      // unknown addresses go to the first page instead of a 404
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
