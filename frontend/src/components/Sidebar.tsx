'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Key, Folder, Database, Terminal, Activity,
  Settings, Sun, Moon, Menu, X, LogOut,
  PanelLeftClose, PanelLeftOpen, ShieldCheck
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/hooks/useTheme'

const AI_PROVIDERS = [
  'openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'together', 'openrouter', 'opencode', 'doubleworld'
]

interface NavItem {
  href: string
  label: string
  icon: any
  type?: 'ai-keys' | 'platform-secrets' | 'folders'
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    id: 'core',
    title: 'Core Platform',
    items: [
      { href: '/keys', label: 'AI Models Vault', icon: Key, type: 'ai-keys' },
      { href: '/vault', label: 'Platform Secrets', icon: ShieldCheck, type: 'platform-secrets' },
    ],
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    items: [
      { href: '/folders', label: 'Workspace Folders', icon: Folder, type: 'folders' },
    ],
  },
  {
    id: 'tools',
    title: 'Developer Suite',
    items: [
      { href: '/models', label: 'Models Catalog', icon: Database },
      { href: '/playground', label: 'Playground Console', icon: Terminal },
      { href: '/logs', label: 'Verification Logs', icon: Activity },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme, mounted } = useTheme()
  const { user, organization, logout } = useAuth()

  // Responsive and collapsible states
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_sidebar_collapsed')
      if (saved !== null) {
        setCollapsed(saved === 'true')
      }
    } catch (_) {}
  }, [])

  const handleToggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('nexus_sidebar_collapsed', String(next))
    } catch (_) {}
  }

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
  })

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  const aiCount = keys.filter((k: any) => AI_PROVIDERS.includes(k.providerCode?.toLowerCase())).length
  const platformCount = keys.filter((k: any) => !AI_PROVIDERS.includes(k.providerCode?.toLowerCase())).length
  const folderCount = folders.length

  const getCount = (type?: string) => {
    if (type === 'ai-keys') return aiCount
    if (type === 'platform-secrets') return platformCount
    if (type === 'folders') return folderCount
    return null
  }

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className={`border-b border-border flex items-center shrink-0 ${
        collapsed ? 'p-3.5 justify-center' : 'px-4 py-3.5 justify-between'
      }`}>
        <Link href="/keys" className="flex items-center gap-2.5 group min-w-0">
          <div className="relative shrink-0">
            <div className="p-2 bg-purple-600/10 border border-purple-500/30 rounded-xl text-purple-500 dark:text-purple-400 group-hover:scale-105 transition-transform shadow-xs">
              <Database className="w-4 h-4" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                  NEXUS AI
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-mono">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate block">
                API & Secrets Vault
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={handleToggleCollapse}
          className="hidden lg:flex p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Middle Scrollable Section with distinct grouped sections */}
      <div className={`flex-1 overflow-y-auto space-y-4 py-3 ${
        collapsed ? 'px-2' : 'px-3'
      }`}>
        {navSections.map((section, idx) => (
          <div key={section.id} className={idx > 0 ? 'pt-2.5 border-t border-border' : ''}>
            {!collapsed ? (
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground px-2.5 block mb-1.5">
                {section.title}
              </span>
            ) : idx > 0 ? (
              <div className="w-6 h-px bg-border mx-auto my-2" />
            ) : null}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href === '/keys' && pathname === '/') ||
                  (item.href === '/folders' && pathname.startsWith('/folders'))
                const count = getCount(item.type)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center rounded-xl text-xs font-semibold transition-all ${
                      collapsed
                        ? 'justify-center p-2.5'
                        : 'justify-between px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-xs'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && count !== null && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' : 'bg-muted text-muted-foreground'
                      }`}>
                        {count}
                      </span>
                    )}
                    {collapsed && count !== null && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modern Compact Integrated Footer (Profile + Settings + Theme) */}
      <div className={`border-t border-border bg-muted/30 dark:bg-zinc-950/60 shrink-0 ${
        collapsed ? 'p-2 flex flex-col items-center gap-2' : 'px-3 py-2.5 flex items-center justify-between'
      }`}>
        {/* User Avatar & Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {(user?.name || user?.email || 'A')[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate block leading-tight">
                {user?.name || user?.email || 'Admin'}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono block truncate">
                {organization?.name || 'Workspace'}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions (Settings, Theme, Logout) */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
              pathname === '/settings' ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10' : ''
            }`}
            title="Settings & Security"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-muted transition-colors cursor-pointer"
            title={mounted && theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
          </button>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 glass-panel rounded-lg border border-[#1f1f23] text-zinc-400 hover:text-zinc-200 cursor-pointer"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 glass-panel border-r border-border flex flex-col h-full shrink-0 transition-all duration-200
        ${collapsed ? 'lg:w-16 w-60' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  )
}
