import {
  Activity, AppWindow, BadgeCheck, Briefcase, Building2, Cloud, CloudCog, Code, CreditCard, Download,
  Globe, Handshake, History, KeyRound, KeySquare, Laptop, LayoutGrid, Link, Mail, MailSearch,
  Monitor, MonitorPlay, Network, Package, Repeat, ScanSearch, Shield, ShieldCheck, Smartphone, SquareCheck,
  SquareTerminal, Terminal, TimerReset, Trash2, UserCog, Users, UsersRound, Waypoints, type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    id: 'quick',
    label: 'Quick actions',
    items: [
      { label: 'Create mail', path: '/quick/create-mail', icon: Mail },
      { label: 'Check code', path: '/quick/check-code', icon: SquareCheck },
      { label: '2FA code', path: '/quick/2fa-code', icon: ShieldCheck },
      { label: 'Reuse users', path: '/quick/reuse-users', icon: Repeat },
      { label: 'Bulk delete', path: '/quick/bulk-delete', icon: Trash2 },
      { label: 'Renew pass', path: '/quick/renew-pass', icon: TimerReset },
    ],
  },
  {
    id: 'overview',
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutGrid }],
  },
  {
    id: 'identity',
    label: 'Identity',
    items: [
      { label: 'Users', path: '/identity/users', icon: Users },
      { label: 'Password reset', path: '/identity/password-reset', icon: KeyRound },
      { label: 'Groups', path: '/identity/groups', icon: UsersRound },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    items: [
      { label: 'Product', path: '/billing/products', icon: Package },
      { label: 'Licenses', path: '/billing/licenses', icon: BadgeCheck },
      { label: 'Payment methods', path: '/billing/payment-methods', icon: CreditCard },
      { label: 'Partner relationships', path: '/billing/partners', icon: Handshake },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { label: 'Conditional Access', path: '/security/conditional-access', icon: Shield },
      { label: 'Domains', path: '/security/domains', icon: Globe },
      { label: 'Security Info', path: '/security/security-info', icon: ShieldCheck },
      { label: 'Service health', path: '/security/service-health', icon: Activity },
    ],
  },
  {
    id: 'devices',
    label: 'Devices',
    items: [
      { label: 'Intune Devices', path: '/devices/intune', icon: Smartphone },
      { label: 'Windows 365', path: '/devices/windows-365', icon: Monitor },
    ],
  },
  {
    id: 'admin',
    label: 'Admin 365',
    items: [
      { label: 'Exchange Online', path: '/admin/exchange', icon: Mail },
      { label: 'SharePoint', path: '/admin/sharepoint', icon: Globe },
      { label: 'Outlook', path: '/admin/outlook', icon: Mail },
      { label: 'Mailbox Search', path: '/admin/mailbox-search', icon: MailSearch },
      { label: 'LinkedIn', path: '/admin/linkedin', icon: Briefcase },
      { label: 'Device tools', path: '/admin/device-tools', icon: Laptop },
      { label: 'Graph Console', path: '/admin/graph-console', icon: Network },
      { label: 'App registrations', path: '/admin/app-registrations', icon: LayoutGrid },
      { label: 'Enterprise apps', path: '/admin/enterprise-apps', icon: AppWindow },
      { label: 'Roles & admins', path: '/admin/roles', icon: UserCog },
      { label: 'Compromise Hunt', path: '/admin/compromise-hunt', icon: ScanSearch },
      { label: 'Sign-in logs', path: '/admin/sign-in-logs', icon: History },
      { label: 'Admin Units', path: '/admin/admin-units', icon: Building2 },
      { label: 'OneDrive', path: '/admin/onedrive', icon: Cloud },
      { label: 'Azure', path: '/admin/azure', icon: CloudCog },
      { label: 'MSDN', path: '/admin/msdn', icon: Code },
      { label: 'Downloads', path: '/admin/downloads', icon: Download },
      { label: 'Access Console', path: '/admin/access-console', icon: SquareTerminal },
      { label: 'Remote Desktop', path: '/admin/remote-desktop', icon: MonitorPlay },
      { label: 'VM Terminal', path: '/admin/vm-terminal', icon: Terminal },
      { label: 'Proxy Pool', path: '/admin/proxy-pool', icon: Waypoints },
      { label: 'Pidkey', path: '/admin/pidkey', icon: KeySquare },
      { label: 'Admin links', path: '/admin/links', icon: Link },
    ],
  },
]

export const allNavItems = navigation.flatMap((g) => g.items.map((item) => ({ ...item, group: g })))

export function findNavItem(pathname: string) {
  return allNavItems.find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
}
