// frontend/src/components/Layout.tsx
// Main layout with sidebar, header, and navigation

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Box, RefreshCw, ClipboardCheck, BarChart2, FileText, 
  Settings, Users, Menu, X, ChevronLeft, ChevronRight, Bell, 
  Sun, Moon, Monitor, LogOut, User, Search, HelpCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/helpers';
import { useToast } from './ui/useToast';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Box },
  { name: 'Lifecycle', href: '/maintenance', icon: RefreshCw },
  { name: 'Audits', href: '/audits', icon: ClipboardCheck },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Documents', href: '/documents', icon: FileText },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: Monitor },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-card border-r border-border transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-20',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <NavLink to="/" className="flex items-center gap-2" aria-label="Asset Maintenance Tool Home">
            <Box className="h-8 w-8 text-primary" />
            {sidebarOpen && (
              <span className="font-semibold text-lg text-foreground">AssetMT</span>
            )}
          </NavLink>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              'p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
              !sidebarOpen && 'mx-auto'
            )}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  !sidebarOpen && 'justify-center'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={sidebarOpen ? undefined : item.name}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {sidebarOpen && <span>{item.name}</span>}
              </NavLink>
            );
          })}

          <div className="pt-4 border-t border-border" />
          
          {user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN' || user?.role === 'IT_ASSET_MANAGER' ? (
            <>
              <div className={cn('px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider', !sidebarOpen && 'hidden')}>
                Administration
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      !sidebarOpen && 'justify-center'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={sidebarOpen ? undefined : item.name}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </NavLink>
                );
              })}
            </>
          ) : (
            <>
              <div className={cn('px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider', !sidebarOpen && 'hidden')}>
                Account
              </div>
              <NavLink
                to="/settings"
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  !sidebarOpen && 'justify-center'
                )}
                title={sidebarOpen ? undefined : 'Settings'}
              >
                <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {sidebarOpen && <span>Settings</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom: User info */}
        <div className="p-4 border-t border-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="mx-auto p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border',
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
        )}
      >
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Search */}
          <div className={cn('flex-1 max-w-md', sidebarOpen ? 'lg:block' : 'hidden')}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search assets, people, sites, audits... (⌘K)"
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Global search"
              />
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : theme === 'light' ? 'Switch to system mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : theme === 'light' ? 'System mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : theme === 'light' ? <Monitor className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                  3
                </span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-popover border border-border rounded-lg shadow-lg py-2">
                  <div className="px-4 py-2 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">Asset Overdue</p>
                      <p className="text-xs text-muted-foreground">LPT-0042 is 2 days overdue</p>
                      <p className="text-xs text-muted-foreground mt-1">5 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">Maintenance Due</p>
                      <p className="text-xs text-muted-foreground">MON-0012 preventive maintenance due tomorrow</p>
                      <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">Warranty Expiring</p>
                      <p className="text-xs text-muted-foreground">PRN-0005 warranty expires in 7 days</p>
                      <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border">
                    <NavLink to="/notifications" className="block px-4 py-2 text-sm text-primary hover:bg-accent rounded-lg">
                      View all notifications
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(false)} // placeholder for user menu
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                {sidebarOpen && (
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {user?.first_name}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] transition-all duration-300',
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
        )}
        role="main"
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}