import { Eye, EyeOff, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide'
import { MorphIcon, type MorphIconProps } from 'morphicons/react'

// Same Morphicons setup as Family Photos: an icon that morphs whenever `icon` changes.
export const morphIcons = { Eye, EyeOff, Moon, Sun, SidebarCollapse: PanelLeftClose, SidebarExpand: PanelLeftOpen }

type MorphProps = Omit<MorphIconProps, 'from' | 'to' | 'progress' | 'spring' | 'label'> & { 'aria-label'?: string }

export function Morph({ icon, size = 20, 'aria-label': label, ...rest }: MorphProps) {
  return <MorphIcon icon={icon} size={size} strokeWidth={1.75} spring="smooth" reducedMotion="user" label={label} {...rest} />
}
