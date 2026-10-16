import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Toaster as Sonner, toast as sonner } from 'sonner'
import { useIsDark } from '@/lib/theme'

/**
 * App-wide notifications (Sonner), styled like Family Photos.
 * Mounted once in main.tsx. Call through `notify`.
 */
export function AppToaster() {
  const dark = useIsDark()
  return (
    <Sonner
      theme={dark ? 'dark' : 'light'}
      position="bottom-right"
      offset={24}
      mobileOffset={16}
      visibleToasts={3}
      closeButton
      icons={{
        success: <CircleCheck className="size-5 text-ok" strokeWidth={2.25} />,
        error: <CircleAlert className="size-5 text-danger" strokeWidth={2.25} />,
        warning: <TriangleAlert className="size-5 text-warn" strokeWidth={2.25} />,
        info: <Info className="size-5 text-ink-2" />,
        loading: <span className="block size-4 animate-spin rounded-full border-2 border-rule border-t-coral" aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group relative flex w-[min(92vw,380px)] items-start gap-3 rounded-[var(--radius-paper)] border border-line bg-paper py-3.5 pr-10 pl-4 text-ink shadow-[0_16px_40px_-16px_hsl(var(--shadow)/0.45)]',
          title: 'text-[0.95rem] font-semibold leading-snug',
          description: 'mt-0.5 text-sm text-ink-2',
          icon: 'mt-0.5 shrink-0',
          success: 'border-ok/40',
          error: 'border-danger/50 bg-[color-mix(in_oklch,var(--danger)_8%,var(--paper))]',
          warning: 'border-warn/50',
          actionButton: 'ml-auto shrink-0 rounded-full bg-coral px-3 py-1 text-sm font-semibold text-on-coral',
          closeButton:
            'absolute top-2 right-2 flex size-7 translate-none items-center justify-center rounded-full border-0 bg-transparent text-ink-3 hover:bg-paper-2 hover:text-ink',
        },
      }}
    />
  )
}

type Options = Parameters<typeof sonner>[1]

export const notify = {
  success: (message: string, o?: Options) => sonner.success(message, o),
  // errors stay a little longer so they can be read
  error: (message: string, o?: Options) => sonner.error(message, { duration: 6000, ...o }),
  warning: (message: string, o?: Options) => sonner.warning(message, o),
  info: (message: string, o?: Options) => sonner.info(message, o),
}
