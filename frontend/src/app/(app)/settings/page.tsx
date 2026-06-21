'use client'

import React, { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Sun, Moon, Bell, Shield, Key, Palette } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { theme, toggleTheme, mounted } = useTheme()
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1')
  const [notifications, setNotifications] = useState(true)

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('API URL updated (not persisted in this demo)')
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-4 lg:p-6 border-b border-[#1f1f23] shrink-0">
        <h2 className="text-lg font-bold text-white tracking-tight">Settings</h2>
        <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">Configure your AI Registry preferences.</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 max-w-3xl">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Appearance</h3>
                <p className="text-xs text-zinc-500">Customize the look and feel</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-400" />) : <div className="w-5 h-5" />}
              <div>
                <span className="text-sm text-white font-medium">Theme</span>
                <p className="text-xs text-zinc-500">{mounted ? (theme === 'dark' ? 'Dark mode is active' : 'Light mode is active') : ''}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              {mounted ? (theme === 'dark' ? 'Switch to Light' : 'Switch to Dark') : '...'}
            </Button>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">API Configuration</h3>
                <p className="text-xs text-zinc-500">Backend API connection settings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <Input
                label="API Base URL"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:4000/api/v1"
              />
              <Button type="submit" size="sm">Save</Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Notifications</h3>
                <p className="text-xs text-zinc-500">Manage alert preferences</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white font-medium">Enable Notifications</span>
              <p className="text-xs text-zinc-500">Receive alerts for failed validations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white" />
            </label>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Security</h3>
                <p className="text-xs text-zinc-500">Data encryption and access controls</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white font-medium">API Key Encryption</span>
                <p className="text-xs text-zinc-500">All keys encrypted at rest using AES-256</p>
              </div>
              <span className="text-[10px] bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">ACTIVE</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
