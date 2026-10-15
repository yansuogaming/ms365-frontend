/** Brass-framed letter tile: the product mark, drawn rather than imported. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="3" fill="#1c1d1f" stroke="#b48a3c" strokeWidth="2" />
      <path d="M6.5 18V8.5l3.25 5 3.25-5V18" fill="none" stroke="#f2f1ec" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15.5 8.5h4M15.5 13h3.2M15.5 17.5h4" stroke="#b48a3c" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
