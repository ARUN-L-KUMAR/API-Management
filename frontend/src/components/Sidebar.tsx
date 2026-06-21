'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Key, Folder, Database, Terminal, Activity,
  Plus, Trash2, Settings, Sun, Moon, Menu, X, Edit3, LogOut, User,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { useTheme } from '@/hooks/useTheme'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

const navItems = [
  { href: '/keys', label: 'API Keys Vault', icon: Key },
  { href: '/models', label: 'Models Catalog', icon: Database },
  { href: '/playground', label: 'Playground Console', icon: Terminal },
  { href: '/logs', label: 'Verification Logs', icon: Activity },
]

export default function Sidebar() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { theme, toggleTheme, mounted } = useTheme()
  const { user, organization, logout } = useAuth()
  const {
    activeFolderId, activeTagIds, setActiveFolderId, toggleTagId,
  } = useStore()

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<any | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  const createFolderMutation = useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setIsFolderModalOpen(false)
      setNewFolderName('')
    },
  })

  const deleteFolderMutation = useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setActiveFolderId(null)
    },
  })

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setIsFolderSettingsOpen(false)
      setEditingFolder(null)
    },
  })

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.createTag(data.name, data.color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setIsTagModalOpen(false)
      setNewTagName('')
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-[#1f1f23] flex items-center gap-3">
        <div className="p-2 bg-purple-600/10 border border-purple-500/30 rounded-lg text-purple-400">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <Link href="/">
            <h1 className="font-bold text-sm leading-none tracking-tight text-white hover:text-purple-400 transition-colors">AI REGISTRY</h1>
          </Link>
          <span className="text-[10px] text-zinc-500 font-medium">Model Discovery Hub</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {/* Navigation */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-3">Navigation</span>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href === '/keys' && pathname === '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Folders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Folders</span>
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveFolderId(null)}
              className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !activeFolderId ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-zinc-500" /> All Keys
              </span>
            </button>
            {folders.map((folder: any) => (
              <div key={folder.id} className="group flex items-center justify-between rounded-lg hover:bg-zinc-900/60">
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-all ${
                    activeFolderId === folder.id ? 'text-purple-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </button>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                  <button
                    onClick={() => { setEditingFolder(folder); setEditFolderName(folder.name); setIsFolderSettingsOpen(true) }}
                    className="p-1 text-zinc-500 hover:text-purple-400 cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteFolderMutation.mutate(folder.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Tags</span>
            <button
              onClick={() => setIsTagModalOpen(true)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 px-3">
            {tags.map((tag: any) => {
              const isSelected = activeTagIds.includes(tag.id)
              return (
                <div
                  key={tag.id}
                  className="group flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer select-none transition-all"
                  style={{
                    borderColor: isSelected ? tag.color : 'rgba(31, 31, 35, 0.5)',
                    backgroundColor: isSelected ? `${tag.color}15` : 'rgba(20, 20, 22, 0.4)',
                    color: isSelected ? tag.color : '#a1a1aa',
                  }}
                  onClick={() => toggleTagId(tag.id)}
                >
                  <span>{tag.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTagMutation.mutate(tag.id) }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-t border-[#1f1f23]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/50">
            <div className="p-1.5 bg-purple-600/10 border border-purple-500/20 rounded-lg text-purple-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-zinc-500 truncate">{organization?.name}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#1f1f23] space-y-1">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            pathname === '/settings' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 transition-all cursor-pointer"
        >
          {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <div className="w-4 h-4" />}
          {mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Theme'}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-panel rounded-lg border border-[#1f1f23] text-zinc-400 hover:text-zinc-200 cursor-pointer"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 glass-panel border-r border-[#1f1f23] flex flex-col h-full shrink-0 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>

      {/* Modals */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Create Folder" maxWidth="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newFolderName.trim()) return
            createFolderMutation.mutate(newFolderName)
          }}
          className="space-y-4"
        >
          <Input
            label="Folder Name"
            placeholder="e.g. Client A, Testing, Production"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" loading={createFolderMutation.isPending}>
            Create Folder
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isFolderSettingsOpen} onClose={() => { setIsFolderSettingsOpen(false); setEditingFolder(null) }} title="Folder Settings" maxWidth="sm">
        {editingFolder && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!editFolderName.trim()) return
              updateFolderMutation.mutate({ id: editingFolder.id, name: editFolderName.trim() })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Folder Name</label>
              <input
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className="w-full bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-3 py-2 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            {editingFolder.createdAt && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Created</label>
                <p className="text-xs text-zinc-500">{new Date(editingFolder.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => { setIsFolderSettingsOpen(false); setEditingFolder(null) }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={updateFolderMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} title="Add Tag" maxWidth="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newTagName.trim()) return
            createTagMutation.mutate({ name: newTagName, color: newTagColor })
          }}
          className="space-y-4"
        >
          <Input
            label="Tag Label Name"
            placeholder="e.g. backup, experimental"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Hex Color Accent</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-10 h-8 bg-transparent border-0 cursor-pointer p-0 shrink-0"
              />
              <Input
                required
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={createTagMutation.isPending}>
            Create Tag
          </Button>
        </form>
      </Modal>
    </>
  )
}
