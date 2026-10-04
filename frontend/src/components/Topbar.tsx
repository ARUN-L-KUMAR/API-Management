'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Search, Bell, Sparkles, Activity, ShieldCheck, 
  ExternalLink, CheckCircle2, ChevronRight, X, Sun, Moon
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'

interface TopbarProps {
  onOpenAddKey?: () => void
}

export function Topbar({ onOpenAddKey }: TopbarProps) {
  const pathname = usePathname()
  const { searchQuery, setSearchQuery } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const { theme, toggleTheme, mounted } = useTheme()

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.getLogs(),
    refetchInterval: 20000,
  })

  const recentLogs = logs.slice(0, 5)
  const workingCount = keys.filter((k: any) => k.status === 'Working').length
  const totalCount = keys.length
  const healthPercent = totalCount > 0 ? Math.round((workingCount / totalCount) * 100) : 100

  const getPageInfo = () => {
    switch (pathname) {
      case '/keys':
      case '/':
        return { title: 'AI Model Keys Vault', category: 'Registry' }
      case '/vault':
        return { title: 'Platform Secrets Vault', category: 'Infrastructure' }
      case '/folders':
        return { title: 'Workspace Folders & Projects', category: 'Environments' }
      case '/models':
        return { title: 'AI Models Catalog', category: 'Discovery' }
      case '/playground':
        return { title: 'Playground Studio', category: 'Workbench' }
      case '/logs':
        return { title: 'Telemetry & Logs', category: 'Observability' }
      case '/settings':
        return { title: 'System Settings', category: 'Configuration' }
      default:
        if (pathname.startsWith('/folders/')) {
          return { title: 'Workspace Keys Explorer', category: 'Workspaces' }
        }
        return { title: 'Console', category: 'Workspace' }
    }
  }

  const { title, category } = getPageInfo()

  return (
    <header className="h-14 border-b border-border bg-card/80 dark:bg-zinc-950/70 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between shrink-0 z-20 transition-colors duration-150">
      {/* Left: Breadcrumbs & Page title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Nexus</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-foreground/80">{category}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
        </div>
        <h1 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight truncate">
          {title}
        </h1>
        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
          <Sparkles className="w-2.5 h-2.5" /> v2.4
        </span>
      </div>

      {/* Center: Global Quick Search */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Quick search keys, models, logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-1.5 bg-input/60 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Health pill & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* System Health Status Beacon */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10px] font-semibold">
            {healthPercent}% Healthy
          </span>
        </div>

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border border-border bg-input/60 hover:bg-muted text-muted-foreground hover:text-amber-500 transition-all cursor-pointer"
          title={mounted && theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {mounted && theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg border border-border bg-input/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer relative"
            title="Activity Feed"
          >
            <Bell className="w-3.5 h-3.5" />
            {recentLogs.some((l: any) => l.status !== 'Success') && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-xl border border-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Live System Events</span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-border my-2 max-h-64 overflow-y-auto">
                {recentLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No recent verification events.
                  </div>
                ) : (
                  recentLogs.map((log: any) => (
                    <div key={log.id} className="py-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">{log.keyName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{log.message}</p>
                      <span className="text-[9px] text-muted-foreground/80 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Environment Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-[10px] font-mono text-muted-foreground">
          <ShieldCheck className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          <span>PROD-CLUSTER</span>
        </div>
      </div>
    </header>
  )
}
