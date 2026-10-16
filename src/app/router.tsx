import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { allNavItems } from './navigation'
import { ModulePending } from './ModulePending'
import { NotFound } from './NotFound'
import { AppShell } from './shell/AppShell'

/**
 * Feature pages register here as they are built, e.g.
 *   { path: 'identity/users', lazy: () => import('@/features/users/route') }
 * Every nav entry without a page falls back to ModulePending.
 */
const builtRoutes: { path: string; lazy: () => Promise<{ Component: React.ComponentType }> }[] = [
  { path: 'dashboard', lazy: () => import('@/features/dashboard/route') },
  { path: 'identity/users', lazy: () => import('@/features/users/route') },
  { path: 'identity/users/bulk-create', lazy: () => import('@/features/users/bulk-create/route') },
  { path: 'identity/users/deleted', lazy: () => import('@/features/users/deleted/route') },
]

const built = new Set(builtRoutes.map((r) => `/${r.path}`))

export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...builtRoutes,
      ...allNavItems.filter((i) => !built.has(i.path)).map((i) => ({ path: i.path.slice(1), Component: ModulePending })),
      { path: '*', Component: NotFound },
    ],
  },
])
