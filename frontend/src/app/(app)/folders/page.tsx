'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Folder, Plus, Search, Edit3, Trash2, Key, ShieldCheck, CheckCircle2,
  XCircle, ChevronRight, ExternalLink, Sparkles, Cloud, ArrowUpRight,
  Database, Layers, Clock, Settings, LayoutGrid, List, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProviderBadge } from '@/components/ui/StatusBadge'

export default function FoldersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<any | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [editFolderName, setEditFolderName] = useState('')

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
  })

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  const createFolderMutation = useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setIsCreateModalOpen(false)
      setNewFolderName('')
      toast.success('Workspace folder created')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setEditingFolder(null)
      toast.success('Folder renamed successfully')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteFolderMutation = useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      toast.success('Workspace folder removed')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const foldersWithStats = useMemo(() => {
    return folders.map((folder: any) => {
      const folderKeys = keys.filter((k: any) => k.folderId === folder.id)
      const workingCount = folderKeys.filter((k: any) => k.status === 'Working').length
      const invalidCount = folderKeys.filter((k: any) => k.status !== 'Working').length
      const providers = Array.from(new Set(folderKeys.map((k: any) => k.providerCode?.toLowerCase())))
      const healthRate = folderKeys.length > 0 ? Math.round((workingCount / folderKeys.length) * 100) : 100

      return {
        ...folder,
        keysCount: folderKeys.length,
        workingCount,
        invalidCount,
        providers,
        healthRate,
      }
    })
  }, [folders, keys])

  const unassignedKeys = useMemo(() => {
    return keys.filter((k: any) => !k.folderId)
  }, [keys])

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return foldersWithStats
    const q = searchQuery.toLowerCase()
    return foldersWithStats.filter((f: any) => f.name.toLowerCase().includes(q))
  }, [foldersWithStats, searchQuery])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    createFolderMutation.mutate(newFolderName.trim())
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFolder || !editFolderName.trim()) return
    updateFolderMutation.mutate({ id: editingFolder.id, name: editFolderName.trim() })
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Subheader / Action Bar */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/60 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Workspace Environments & Folders</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400 font-mono">
              {folders.length} Workspaces
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Segment your API keys and secrets into isolated projects, client workspaces, or deployment stages (Production, Staging).
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          size="md"
          className="shadow-lg shadow-purple-900/25 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Workspace Folder
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <section className="p-4 lg:p-6 pb-0 grid grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
        {/* Metric 1 */}
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group">
          <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Workspaces</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold font-mono">Folders</span>
            </div>
            <h3 className="text-xl font-black text-foreground mt-0.5 tracking-tight">{folders.length}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group">
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Key className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Organized Keys</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Assigned</span>
            </div>
            <h3 className="text-xl font-black text-foreground mt-0.5 tracking-tight">
              {keys.length - unassignedKeys.length} <span className="text-xs text-muted-foreground font-normal">in folders</span>
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <Link
          href="/folders/unassigned"
          className="glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group hover:border-amber-500/40 transition-colors"
        >
          <div className="p-3 bg-amber-600/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Unassigned Keys</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-mono">Root Vault</span>
            </div>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 tracking-tight">
              {unassignedKeys.length} <span className="text-xs text-muted-foreground font-normal">Pending</span>
            </h3>
          </div>
        </Link>

        {/* Metric 4 */}
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden group">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vault Uptime</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono">Health</span>
            </div>
            <h3 className="text-xl font-black text-foreground mt-0.5 tracking-tight">
              {keys.length > 0 ? Math.round((keys.filter((k: any) => k.status === 'Working').length / keys.length) * 100) : 100}%
            </h3>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
        {/* Search & View Mode Toolbar */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workspaces by folder name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Folder Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Folder Directory List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Folders Explorer: Grid View */}
        {filteredFolders.length === 0 ? (
          <EmptyState
            icon={<Folder className="w-10 h-10 text-purple-400" />}
            title="No Workspace Folders Found"
            description="Create workspace folders to isolate production keys, client environments, or testing clusters."
            action={{ label: 'Create First Folder', onClick: () => setIsCreateModalOpen(true) }}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFolders.map((folder: any) => (
              <div
                key={folder.id}
                onClick={() => router.push(`/folders/${folder.id}`)}
                className="group glass-panel p-5 rounded-2xl border border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col justify-between space-y-4 cursor-pointer relative shadow-md hover:shadow-purple-900/15"
              >
                <div className="space-y-3">
                  {/* Top Bar with Icon & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3.5 bg-linear-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-105 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-all shadow-xs">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-foreground text-base tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                          {folder.name}
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                          Created {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Folder Quick Actions */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingFolder(folder)
                          setEditFolderName(folder.name)
                        }}
                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
                        title="Rename Folder"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete workspace "${folder.name}"? (Keys will become unassigned)`)) {
                            deleteFolderMutation.mutate(folder.id)
                          }
                        }}
                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Pill Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-muted border border-border text-xs font-mono font-bold text-foreground">
                      {folder.keysCount} {folder.keysCount === 1 ? 'Key' : 'Keys'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {folder.workingCount} Valid
                    </span>
                    {folder.invalidCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] font-mono font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {folder.invalidCount} Issue
                      </span>
                    )}
                  </div>

                  {/* Platforms Inside preview */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Platforms Inside
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {folder.providers.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No keys in this workspace</span>
                      ) : (
                        folder.providers.map((p: string) => (
                          <ProviderBadge key={p} provider={p} />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action: Open Folder */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[11px] text-muted-foreground font-medium">Click to open folder</span>
                  <div className="inline-flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all">
                    <span>Open Folder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}

            {/* Root Vault (Unassigned) Folder Tile */}
            <div
              onClick={() => router.push('/folders/unassigned')}
              className="group glass-panel p-5 rounded-2xl border border-dashed border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all flex flex-col justify-between space-y-4 cursor-pointer bg-card shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 bg-amber-600/10 border border-amber-500/25 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-all">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-base tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      Root Vault (Unassigned)
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                      Keys with no workspace folder assigned
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-muted border border-border text-xs font-mono font-bold text-foreground">
                    {unassignedKeys.length} Unassigned Keys
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  These keys are vaulted globally in your organization. You can assign them to any workspace folder.
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-[11px] text-muted-foreground font-medium">Click to open folder</span>
                <div className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all">
                  <span>Open Root Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Folders Explorer: Table / List View */
          <div className="glass-panel rounded-2xl border border-border overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Workspace Folder</th>
                  <th className="py-3 px-4">Key Inventory</th>
                  <th className="py-3 px-4">Health Rate</th>
                  <th className="py-3 px-4">Platforms</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFolders.map((folder: any) => (
                  <tr
                    key={folder.id}
                    onClick={() => router.push(`/folders/${folder.id}`)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-bold text-foreground text-xs block group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                            {folder.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Created {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'Active'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-foreground font-bold">{folder.keysCount} keys</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {folder.workingCount} Valid ({folder.healthRate}%)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {folder.providers.slice(0, 3).map((p: string) => (
                          <ProviderBadge key={p} provider={p} />
                        ))}
                        {folder.providers.length > 3 && (
                          <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.5 rounded bg-muted">
                            +{folder.providers.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingFolder(folder)
                            setEditFolderName(folder.name)
                          }}
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete workspace "${folder.name}"?`)) {
                              deleteFolderMutation.mutate(folder.id)
                            }
                          }}
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Unassigned row */}
                <tr
                  onClick={() => router.push('/folders/unassigned')}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group bg-muted/20"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <span className="font-bold text-foreground text-xs block group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                          Root Vault (Unassigned)
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">Globally stored keys</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{unassignedKeys.length} keys</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-mono text-muted-foreground">Unassigned</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-muted-foreground italic">Various</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Workspace Folder Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Workspace Folder"
        maxWidth="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="e.g. Tripxplo, Production, Client Alpha"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            required
            autoFocus
          />
          <p className="text-xs text-zinc-400">
            Folders let you isolate API keys and model credentials for specific clients, repositories, or environments.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createFolderMutation.isPending}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit / Rename Folder Modal */}
      <Modal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        title="Rename Workspace Folder"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Folder Name"
            value={editFolderName}
            onChange={(e) => setEditFolderName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditingFolder(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updateFolderMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
