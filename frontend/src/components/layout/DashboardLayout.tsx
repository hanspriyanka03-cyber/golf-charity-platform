import { type ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Target,
  Trophy,
  Heart,
  Settings,
  Shield,
  Users,
  Dices,
  Building2,
  CheckSquare,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../ui/Badge'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  adminOnly?: boolean
}

const userNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/dashboard/scores', label: 'My Scores', icon: <Target size={18} /> },
  { to: '/dashboard/draws', label: 'Draws', icon: <Trophy size={18} /> },
  { to: '/dashboard/charity', label: 'My Charity', icon: <Heart size={18} /> },
  { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
]

const adminNavItems: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { to: '/admin/draws', label: 'Draws', icon: <Dices size={18} /> },
  { to: '/admin/charities', label: 'Charities', icon: <Building2 size={18} /> },
  { to: '/admin/winners', label: 'Winners', icon: <CheckSquare size={18} /> },
]

interface DashboardLayoutProps {
  children: ReactNode
  isAdmin?: boolean
}

export default function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = isAdmin ? adminNavItems : userNavItems

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-64' : collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center ${collapsed && !mobile ? 'justify-center px-3' : 'justify-between px-5'} h-16 border-b border-border`}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2">
            <Shield size={18} className={isAdmin ? 'text-accent' : 'text-primary-400'} />
            <span className="text-sm font-semibold text-text-primary">
              {isAdmin ? 'Admin' : 'Dashboard'}
            </span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* User info */}
      {(!collapsed || mobile) && user && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-background shrink-0">
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.full_name || 'User'}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          </div>
          {user.subscription_status === 'active' && (
            <Badge variant="gold" className="mt-2 text-xs">Active Subscriber</Badge>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center ${collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isActive(item.to)
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
            title={collapsed && !mobile ? item.label : undefined}
          >
            <span className={isActive(item.to) ? 'text-accent' : 'text-text-muted group-hover:text-text-primary transition-colors'}>
              {item.icon}
            </span>
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Switch between admin/user */}
        {user?.role === 'admin' && (
          <div className="pt-2 border-t border-border mt-2">
            <Link
              to={isAdmin ? '/dashboard' : '/admin'}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center ${collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-accent hover:bg-accent/10 transition-all`}
            >
              <Shield size={18} />
              {(!collapsed || mobile) && <span>{isAdmin ? 'User View' : 'Admin Panel'}</span>}
            </Link>
          </div>
        )}
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-surface border-r border-border shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full bg-surface border-r border-border z-50 md:hidden flex flex-col"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-text-primary">
            {isAdmin ? 'Admin Panel' : 'Dashboard'}
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
