'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  FileText, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Stethoscope,
  Keyboard,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/billing', label: 'Billing', icon: FileText, shortcut: 'B' },
  { href: '/inventory', label: 'Inventory', icon: Package, shortcut: 'I' },
  { href: '/patients', label: 'Patients', icon: Users, shortcut: 'P' },
  { href: '/reports', label: 'Reports', icon: BarChart3, shortcut: 'R' },
  { href: '/settings', label: 'Settings', icon: Settings, shortcut: 'S' },
]

const SIDEBAR_SHRINKED_KEY = 'atommedz-sidebar-shrinked'

function getInitialShrinkedState(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SIDEBAR_SHRINKED_KEY) === 'true'
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isShrinked, setIsShrinked] = useState(getInitialShrinkedState)

  // Save shrinked state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_SHRINKED_KEY, String(isShrinked))
  }, [isShrinked])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + key for navigation
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            router.push('/billing')
            break
          case 'i':
            e.preventDefault()
            router.push('/inventory')
            break
          case 'p':
            e.preventDefault()
            router.push('/patients')
            break
          case 'r':
            e.preventDefault()
            router.push('/reports')
            break
          case 's':
            e.preventDefault()
            router.push('/settings')
            break
          case 'k':
            e.preventDefault()
            setShowShortcuts(prev => !prev)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleLogout = async () => {
    await logout()
  }

  const toggleShrink = () => {
    setIsShrinked(prev => !prev)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Stethoscope className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col transition-all duration-200 ease-in-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        isShrinked ? "lg:w-16" : "lg:w-64"
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-border",
          isShrinked ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!isShrinked && (
            <>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-7 w-7 text-primary flex-shrink-0" />
                <span className="font-bold text-lg">Atom Medz</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-8 w-8"
                onClick={toggleShrink}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </>
          )}
          {isShrinked && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8"
              onClick={toggleShrink}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={pathname === item.href ? 'default' : 'ghost'}
                    className={cn(
                      "w-full gap-3",
                      pathname === item.href && "bg-primary text-primary-foreground",
                      isShrinked ? "justify-center px-2" : "justify-start"
                    )}
                    onClick={() => {
                      router.push(item.href)
                      setSidebarOpen(false)
                    }}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isShrinked && (
                      <>
                        {item.label}
                        <span className="ml-auto text-xs opacity-60">Alt+{item.shortcut}</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {isShrinked && (
                  <TooltipContent side="right">
                    <p>{item.label} (Alt+{item.shortcut})</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>

        {/* Sidebar Footer - Controls & User */}
        <div className="p-2 border-t border-border space-y-2">
          {/* Theme & Keyboard Controls */}
          <div className={cn("flex gap-1", isShrinked ? "flex-col" : "flex-row")}>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isShrinked ? "icon" : "default"}
                    className={cn(isShrinked ? "w-full" : "flex-1")}
                    onClick={() => setShowShortcuts(prev => !prev)}
                  >
                    <Keyboard className="h-4 w-4" />
                    {!isShrinked && <span className="ml-2">Shortcuts</span>}
                  </Button>
                </TooltipTrigger>
                {isShrinked && (
                  <TooltipContent side="right">
                    <p>Keyboard Shortcuts</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            {isShrinked ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <ThemeToggle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Toggle Theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex-1">
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className={cn(
            "flex items-center gap-2 px-2 py-2 bg-muted/50",
            isShrinked && "justify-center"
          )}>
            <div className="h-8 w-8 bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isShrinked && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.clinicName || 'Personal'}</p>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                    isShrinked ? "justify-center" : "justify-start gap-3"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  {!isShrinked && "Sign Out"}
                </Button>
              </TooltipTrigger>
              {isShrinked && (
                <TooltipContent side="right">
                  <p>Sign Out</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-200",
        isShrinked ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Mobile Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold">Atom Medz</span>
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border border-border p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted border border-border text-xs">Alt+B</kbd>
                  <span>Billing</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted border border-border text-xs">Alt+I</kbd>
                  <span>Inventory</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted border border-border text-xs">Alt+P</kbd>
                  <span>Patients</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted border border-border text-xs">Alt+R</kbd>
                  <span>Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted border border-border text-xs">Alt+S</kbd>
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted border border-border text-xs">Alt+K</kbd>
                  <span>Toggle this help</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Billing Page Shortcuts</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted border border-border text-xs">Ctrl+N</kbd>
                    <span>New Bill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted border border-border text-xs">Ctrl+S</kbd>
                    <span>Save Bill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted border border-border text-xs">Ctrl+P</kbd>
                    <span>Print Bill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted border border-border text-xs">Ctrl+A</kbd>
                    <span>Add Item</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
