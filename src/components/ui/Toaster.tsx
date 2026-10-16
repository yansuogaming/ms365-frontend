import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Toaster as Sonner, toast as sonner } from 'sonner'
import { useIsDark } from '@/lib/theme'
import { Spinner } from './Loader'

/**
 * Modal <dialog>s live in the browser's top layer, above any z-index, and make
 * everything outside them inert. So the toasts render into a host element that
 * follows the topmost open modal dialog (and goes back to <body> when none is
 * open): they show above the dialog and stay clickable. React only owns what is
 * inside the host, so moving the host itself is safe and keeps live toasts.
 */
const host = typeof document === 'undefined' ? null : Object.assign(document.createElement('div'), { id: 'toast-host' })

function useToastHost() {
  useEffect(() => {
    if (!host) return
    const place = () => {
      const modals = [...document.querySelectorAll('dialog[open]')].filter((d) => d.matches(':modal'))
      const target = modals.at(-1) ?? document.body
      if (host.parentElement !== target) target.append(host)
    }
    place()
    // dialogs opening or closing, or a dialog removed from the page with the host inside it
    const watch = new MutationObserver(place)
    watch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] })
    return () => {
      watch.disconnect()
      host.remove()
    }
  }, [])
}

/**
 * App-wide notifications (Sonner), styled like Family Photos.
 * Mounted once in main.tsx. Call through `notify`.
 */
export function AppToaster() {
  const dark = useIsDark()
  useToastHost()
  if (!host) return null
  return createPortal(
    <>
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
          loading: <Spinner size="sm" />,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'group relative flex w-[min(92vw,380px)] items-start gap-3 rounded-[var(--radius-paper)] border border-line bg-paper py-3.5 pr-10 pl-4 text-ink shadow-[0_16px_40px_-16px_hsl(var(--shadow)/0.45)]',
            title: 'text-[0.95rem] font-semibold leading-snug',
            description: 'mt-0.5 text-sm text-ink-2',
            icon: 'mt-0.5 grid size-5 shrink-0 place-items-center',
            // Sonner positions its loader absolutely; keep it in the icon slot instead
            loader: 'static! transform-none!',
            success: 'border-ok/40',
            error: 'border-danger/50 bg-[color-mix(in_oklch,var(--danger)_8%,var(--paper))]',
            warning: 'border-warn/50',
            actionButton: 'ml-auto shrink-0 rounded-full bg-coral px-3 py-1 text-sm font-semibold text-on-coral',
            closeButton:
              'absolute top-2 right-2 flex size-7 translate-none items-center justify-center rounded-full border-0 bg-transparent text-ink-3 hover:bg-paper-2 hover:text-ink',
          },
        }}
      />
    </>,
    host,
  )
}

type Options = Parameters<typeof sonner>[1]

export const notify = {
  success: (message: string, o?: Options) => sonner.success(message, o),
  // errors stay a little longer so they can be read
  error: (message: string, o?: Options) => sonner.error(message, { duration: 6000, ...o }),
  warning: (message: string, o?: Options) => sonner.warning(message, o),
  info: (message: string, o?: Options) => sonner.info(message, o),
  /** Stays until replaced: pass the returned id to a later success/error, or dismiss it. */
  loading: (message: string, o?: Options) => sonner.loading(message, o),
  dismiss: (id?: string | number) => sonner.dismiss(id),
}
