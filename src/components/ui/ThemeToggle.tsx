import { toggleTheme, useIsDark } from '@/lib/theme'
import { IconButton } from './Button'
import { Morph, morphIcons } from './Morph'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const dark = useIsDark()
  return (
    <IconButton label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme} className={className}>
      {/* the sun morphs into the moon and back */}
      <Morph icon={dark ? morphIcons.Sun : morphIcons.Moon} size={20} />
    </IconButton>
  )
}
