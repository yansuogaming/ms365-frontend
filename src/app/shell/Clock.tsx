import { useEffect, useState } from 'react'

const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** Local time, so the operator can match actions against sign-in logs. */
/** `className` sets the display (default inline-flex), e.g. "hidden xl:inline-flex". */
export function Clock({ className = 'inline-flex' }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <time dateTime={now.toISOString()} className={`h-9 items-center gap-2 rounded-full border border-line bg-paper px-3.5 text-sm ${className}`}>
      <span className="text-ink-3">{date.format(now)}</span>
      <span className="tabular font-semibold">{time.format(now)}</span>
    </time>
  )
}
