import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import { errorText } from './components/ui/admin'
import { AppToaster, notify } from './components/ui/Toaster'
import './index.css'

declare module '@tanstack/react-query' {
  interface Register {
    /** `silentError`: the caller reports the failure itself, so skip the global toast. */
    mutationMeta: { silentError?: boolean }
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
  // Every failed action surfaces as an error toast; success toasts are worded per action.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!mutation.meta?.silentError) notify.error(errorText(error))
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <AppToaster />
    </QueryClientProvider>
  </StrictMode>,
)
