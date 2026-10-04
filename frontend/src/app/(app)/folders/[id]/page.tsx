'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Folder, ArrowLeft, Plus, Search, Eye, EyeOff, Copy, RefreshCw,
  Trash2, Edit3, CheckCircle, XCircle, AlertTriangle, ShieldCheck,
  Key, Sparkles, Database, Terminal, CheckCircle2, ChevronRight,
  ExternalLink, Layers, Check, LayoutGrid, List, Mail, Phone
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProviderBadge, StatusBadge } from '@/components/ui/StatusBadge'

const AI_PROVIDERS = [
  'openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'together', 'openrouter', 'opencode', 'doubleworld'
]

export default function FolderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const folderId = params?.id as string

  const isUnassigned = folderId === 'unassigned'

  // View & UI states
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [categoryTab, setCategoryTab] = useState<'all' | 'ai' | 'platform'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'working' | 'invalid' | null>(null)
  const [providerFilter, setProviderFilter] = useState<string | null>(null)
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [plainSecrets, setPlainSecrets] = useState<Record<string, string>>({})
  const [loadingSecretKeyId, setLoadingSecretKeyId] = useState<string | null>(null)

  // Modals
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<any | null>(null)
  const [inspectingKeyForModels, setInspectingKeyForModels] = useState<any | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Add Key Form
  const [vaultCategory, setVaultCategory] = useState<'ai' | 'platform'>('ai')
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('openai')
  const [newKeySecret, setNewKeySecret] = useState('')
  const [newKeyAccountEmail, setNewKeyAccountEmail] = useState('')
  const [newKeyAccountPhone, setNewKeyAccountPhone] = useState('')
  const [newKeyDesc, setNewKeyDesc] = useState('')
  const [newKeyMonitor, setNewKeyMonitor] = useState(true)

  // Fetch Folders
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
  })

  const currentFolder = useMemo(() => {
    if (isUnassigned) {
      return {
        id: 'unassigned',
        name: 'Root Vault (Unassigned)',
        createdAt: undefined,
      }
    }
    return folders.find((f: any) => f.id === folderId)
  }, [folders, folderId, isUnassigned])

  // Fetch Keys
  const { data: allKeys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  // Filter keys for this folder
  const folderKeys = useMemo(() => {
    if (isUnassigned) {
      return allKeys.filter((k: any) => !k.folderId)
    }
    return allKeys.filter((k: any) => k.folderId === folderId)
  }, [allKeys, folderId, isUnassigned])

  // Filtered keys by local search, status, provider, category
  const filteredKeys = useMemo(() => {
    return folderKeys.filter((key: any) => {
      const isAi = AI_PROVIDERS.includes(key.providerCode?.toLowerCase())
      if (categoryTab === 'ai' && !isAi) return false
      if (categoryTab === 'platform' && isAi) return false

      if (statusFilter === 'working' && key.status !== 'Working') return false
      if (statusFilter === 'invalid' && key.status === 'Working') return false

      if (providerFilter && key.providerCode?.toLowerCase() !== providerFilter.toLowerCase()) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matches =
          key.keyName?.toLowerCase().includes(q) ||
          key.providerCode?.toLowerCase().includes(q) ||
          (key.description && key.description.toLowerCase().includes(q))
        if (!matches) return false
      }

      return true
    })
  }, [folderKeys, categoryTab, statusFilter, providerFilter, searchQuery])

  // Mutations
  const createKeyMutation = useMutation({
    mutationFn: api.createKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setIsAddKeyModalOpen(false)
      resetKeyForm()
      toast.success(`API Key secured into ${currentFolder?.name || 'folder'}`)
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateKeyMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => api.updateKey(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setEditingKey(null)
      toast.success('Key updated')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: api.deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      toast.success('Key removed from folder')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const validateKeyMutation = useMutation({
    mutationFn: api.validateKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success('Validation probe dispatched')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setIsRenameModalOpen(false)
      toast.success('Workspace folder renamed')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteFolderMutation = useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      toast.success('Workspace folder removed')
      router.push('/folders')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const resetKeyForm = () => {
    setVaultCategory('ai')
    setNewKeyName('')
    setNewKeyProvider('openai')
    setNewKeySecret('')
    setNewKeyAccountEmail('')
    setNewKeyAccountPhone('')
    setNewKeyDesc('')
    setNewKeyMonitor(true)
  }

  const handleToggleReveal = async (key: any) => {
    if (revealedKeyId === key.id) {
      setRevealedKeyId(null)
      return
    }

    if (plainSecrets[key.id] || key.plainApiKey) {
      setRevealedKeyId(key.id)
      return
    }

    try {
      setLoadingSecretKeyId(key.id)
      const res = await api.getKey(key.id)
      if (res?.plainApiKey) {
        setPlainSecrets((prev) => ({ ...prev, [key.id]: res.plainApiKey || '' }))
        key.plainApiKey = res.plainApiKey
        setRevealedKeyId(key.id)
      } else {
        toast.error('Unable to retrieve decrypted secret')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to decrypt secret')
    } finally {
      setLoadingSecretKeyId(null)
    }
  }

  const handleCopyKey = async (key: any) => {
    let secret = plainSecrets[key.id] || key.plainApiKey || key.apiKey
    if (!secret) {
      try {
        setLoadingSecretKeyId(key.id)
        const res = await api.getKey(key.id)
        if (res?.plainApiKey) {
          secret = res.plainApiKey
          key.plainApiKey = res.plainApiKey
          setPlainSecrets((prev) => ({ ...prev, [key.id]: res.plainApiKey || '' }))
        }
      } catch (err: any) {
        toast.error('Failed to retrieve secret to copy')
        return
      } finally {
        setLoadingSecretKeyId(null)
      }
    }

    if (secret) {
      try {
        await navigator.clipboard.writeText(secret)
        setCopiedKeyId(key.id)
        toast.success('Key copied to clipboard')
        setTimeout(() => setCopiedKeyId(null), 2000)
      } catch {
        toast.error('Clipboard permission denied')
      }
    } else {
      toast.error('No secret available to copy')
    }
  }

  const totalCount = folderKeys.length
  const aiCount = useMemo(() => folderKeys.filter((k: any) => AI_PROVIDERS.includes(k.providerCode?.toLowerCase())).length, [folderKeys])
  const platformCount = useMemo(() => folderKeys.filter((k: any) => !AI_PROVIDERS.includes(k.providerCode?.toLowerCase())).length, [folderKeys])
  const workingCount = useMemo(() => folderKeys.filter((k: any) => k.status === 'Working').length, [folderKeys])
  const invalidCount = useMemo(() => folderKeys.filter((k: any) => k.status !== 'Working').length, [folderKeys])
  const healthRate = totalCount > 0 ? Math.round((workingCount / totalCount) * 100) : 100
  const uniqueProviders = useMemo(() => Array.from(new Set(folderKeys.map((k: any) => k.providerCode?.toLowerCase()))), [folderKeys])

  // Key models query for inspection modal
  const { data: keyModels = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['key-models', inspectingKeyForModels?.id],
    queryFn: () => (inspectingKeyForModels ? api.getKeyModels(inspectingKeyForModels.id, true, true) : Promise.resolve([])),
    enabled: !!inspectingKeyForModels,
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Header & Breadcrumb */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/70 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4 shrink-0 transition-colors duration-150">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/folders"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspaces
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Folder className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              {currentFolder?.name || 'Workspace Folder'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isUnassigned && currentFolder && (
              <>
                <button
                  onClick={() => {
                    setRenameValue(currentFolder.name)
                    setIsRenameModalOpen(true)
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-card dark:bg-zinc-900 hover:bg-muted border border-border text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete workspace "${currentFolder.name}"? Vault keys will become unassigned.`)) {
                      deleteFolderMutation.mutate(currentFolder.id)
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}

            <Button
              onClick={() => setIsAddKeyModalOpen(true)}
              variant="primary"
              size="sm"
              className="shadow-md shadow-purple-900/25"
            >
              <Plus className="w-3.5 h-3.5" /> Add API Key to Folder
            </Button>
          </div>
        </div>

        {/* Folder Overview Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-600/10 border border-purple-500/25 rounded-2xl text-purple-600 dark:text-purple-400 shadow-xs">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  {currentFolder?.name || 'Workspace'}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300">
                  {totalCount} {totalCount === 1 ? 'Key' : 'Keys'}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  healthRate >= 90
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {healthRate}% Health
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUnassigned
                  ? 'Keys vaulted globally with no assigned workspace. You can edit them to assign a project.'
                  : 'Isolated workspace environment for your project credentials and models.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Pills - Light & Dark adaptive */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-800 dark:text-zinc-400 font-medium">Valid:</span>
              <span className="font-mono font-bold text-emerald-950 dark:text-white">{workingCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs flex items-center gap-2 shadow-xs">
              <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-zinc-400 font-medium">Issues:</span>
              <span className="font-mono font-bold text-red-950 dark:text-white">{invalidCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-800 dark:text-zinc-400 font-medium">Platforms:</span>
              <span className="font-mono font-bold text-purple-950 dark:text-white">{uniqueProviders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tab Switcher: AI Models vs Platform & Cloud Secrets */}
      <div className="px-4 lg:px-6 pt-2 pb-0 bg-card/80 dark:bg-zinc-950/70 border-b border-border flex items-center gap-2 shrink-0">
        <button
          onClick={() => setCategoryTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            categoryTab === 'ai'
              ? 'border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-500/10 rounded-t-lg shadow-xs'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>AI Model Keys</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            categoryTab === 'ai' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' : 'bg-muted text-muted-foreground'
          }`}>
            {aiCount}
          </span>
        </button>

        <button
          onClick={() => setCategoryTab('platform')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
            categoryTab === 'platform'
              ? 'border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-500/10 rounded-t-lg shadow-xs'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Platform & Cloud</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            categoryTab === 'platform' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-muted text-muted-foreground'
          }`}>
            {platformCount}
          </span>
        </button>

        <button
          onClick={() => setCategoryTab('all')}
          className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-medium transition-all cursor-pointer ${
            categoryTab === 'all'
              ? 'border-purple-500 text-foreground bg-purple-500/10 dark:bg-zinc-800/40 rounded-t-lg shadow-xs font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-muted-foreground" />
          <span>All Keys</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            categoryTab === 'all' ? 'bg-purple-500/20 text-purple-700 dark:text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {totalCount}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Toolbar: Search, Filters, View Mode */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search keys in ${currentFolder?.name || 'folder'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Provider Filter */}
            <select
              value={providerFilter || ''}
              onChange={(e) => setProviderFilter(e.target.value || null)}
              className="bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground px-3 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Platforms ({uniqueProviders.length})</option>
              {uniqueProviders.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Status Quick Filters */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted dark:bg-zinc-900/80 border border-border dark:border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === null ? 'bg-purple-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('working')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'working' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                Valid ({workingCount})
              </button>
              <button
                onClick={() => setStatusFilter('invalid')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'invalid' ? 'bg-red-600 text-white shadow-xs' : 'text-muted-foreground hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                Issues ({invalidCount})
              </button>
            </div>

            {(searchQuery || providerFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setProviderFilter(null)
                  setStatusFilter(null)
                }}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold px-2 py-1 bg-purple-500/10 rounded-lg cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Keys List / Table View */}
        {filteredKeys.length === 0 ? (
          <EmptyState
            icon={<Key className="w-10 h-10 text-purple-400" />}
            title={folderKeys.length === 0 ? 'Workspace Folder is Empty' : 'No Keys Match Your Filters'}
            description={
              folderKeys.length === 0
                ? `You have not added any API keys or secrets to ${currentFolder?.name || 'this workspace'} yet.`
                : 'Try adjusting your search query or filter tags to find what you need.'
            }
            action={
              folderKeys.length === 0
                ? {
                    label: `+ Add First Key to ${currentFolder?.name || 'Folder'}`,
                    onClick: () => setIsAddKeyModalOpen(true),
                  }
                : undefined
            }
          />
        ) : viewMode === 'table' ? (
          /* Modern Files / Keys Table */
          <div className="glass-panel rounded-2xl border border-border overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/60 dark:bg-zinc-900/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Provider & Secret Name</th>
                    <th className="py-3 px-4">Validity & Key Token</th>
                    <th className="py-3 px-4">Capabilities / Working Models</th>
                    <th className="py-3 px-4 text-center">Monitoring Probe</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredKeys.map((key: any) => {
                    const isRevealed = revealedKeyId === key.id
                    const isCopied = copiedKeyId === key.id
                    const plainSecret = plainSecrets[key.id] || key.plainApiKey
                    const isAi = AI_PROVIDERS.includes(key.providerCode?.toLowerCase())
                    const isLoadingSecret = loadingSecretKeyId === key.id

                    return (
                      <tr key={key.id} className="hover:bg-muted/40 transition-colors group">
                        {/* Provider & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ProviderBadge provider={key.providerCode} />
                            <div className="min-w-0">
                              <span className="font-bold text-foreground text-xs block truncate">{key.keyName}</span>
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                Vaulted {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'Active'}
                              </span>
                              {(key.accountEmail || key.accountPhone) && (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {key.accountEmail && (
                                    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                                      <Mail className="w-2.5 h-2.5 text-muted-foreground" />
                                      {key.accountEmail}
                                    </span>
                                  )}
                                  {key.accountPhone && (
                                    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                                      <Phone className="w-2.5 h-2.5 text-muted-foreground" />
                                      {key.accountPhone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status & Secret Token */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <StatusBadge status={key.status} />
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] text-foreground bg-muted/80 dark:bg-zinc-950/60 px-2.5 py-1 rounded-md border border-border max-w-xs truncate">
                                {isRevealed ? (plainSecret || '••••••••••••••••') : (key.keyMask || '••••••••••••••••')}
                              </span>
                              <button
                                onClick={() => handleToggleReveal(key)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                              >
                                {isLoadingSecret ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                                ) : isRevealed ? (
                                  <EyeOff className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopyKey(key)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                                title="Copy API Key"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Working Models / Capabilities */}
                        <td className="py-3 px-4">
                          {isAi ? (
                            <button
                              onClick={() => setInspectingKeyForModels(key)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/80 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-border hover:border-purple-500/30 text-foreground hover:text-purple-700 dark:hover:text-purple-300 transition-all text-xs font-medium cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                              <span>Inspect Models & Probes</span>
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border">
                              AES-256 Platform Secret
                            </span>
                          )}
                        </td>

                        {/* Monitoring Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() =>
                              updateKeyMutation.mutate({
                                id: key.id,
                                payload: { isMonitoringEnabled: !key.isMonitoringEnabled },
                              })
                            }
                            className={`w-9 h-5 inline-flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                              key.isMonitoringEnabled ? 'bg-purple-600' : 'bg-muted-foreground/30 dark:bg-zinc-800'
                            }`}
                            title={key.isMonitoringEnabled ? 'Monitoring Active (Click to disable)' : 'Monitoring Inactive (Click to enable)'}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                key.isMonitoringEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => validateKeyMutation.mutate(key.id)}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
                              title="Re-probe Key Validity"
                              disabled={validateKeyMutation.isPending}
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${validateKeyMutation.isPending ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => setEditingKey(key)}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                              title="Edit Key Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete API key "${key.keyName}"?`)) {
                                  deleteKeyMutation.mutate(key.id)
                                }
                              }}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKeys.map((key: any) => {
              const isRevealed = revealedKeyId === key.id
              const isCopied = copiedKeyId === key.id
              const plainSecret = plainSecrets[key.id] || key.plainApiKey
              const isAi = AI_PROVIDERS.includes(key.providerCode?.toLowerCase())
              const isLoadingSecret = loadingSecretKeyId === key.id

              return (
                <div
                  key={key.id}
                  className="glass-panel p-4 rounded-2xl border border-border hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <ProviderBadge provider={key.providerCode} />
                        <div>
                          <h4 className="font-bold text-foreground text-sm truncate max-w-[170px]">{key.keyName}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            Vaulted {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'Active'}
                          </span>
                          {(key.accountEmail || key.accountPhone) && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {key.accountEmail && (
                                <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                                  <Mail className="w-2.5 h-2.5 text-muted-foreground" />
                                  {key.accountEmail}
                                </span>
                              )}
                              {key.accountPhone && (
                                <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                                  <Phone className="w-2.5 h-2.5 text-muted-foreground" />
                                  {key.accountPhone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={key.status} />
                    </div>

                    {/* Masked Secret */}
                    <div className="p-2 rounded-xl bg-muted/60 dark:bg-zinc-950/80 border border-border flex items-center justify-between">
                      <span className="font-mono text-[11px] text-foreground dark:text-zinc-300 truncate max-w-[200px]">
                        {isRevealed ? (plainSecret || '••••••••••••••••') : (key.keyMask || '••••••••••••••••')}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleReveal(key)}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                        >
                          {isLoadingSecret ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-500" />
                          ) : isRevealed ? (
                            <EyeOff className="w-3 h-3 text-purple-500" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopyKey(key)}
                          className="p-1 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                          title="Copy API Key"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    {isAi ? (
                      <button
                        onClick={() => setInspectingKeyForModels(key)}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> Inspect Models
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground">Platform Secret</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => validateKeyMutation.mutate(key.id)}
                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 rounded-lg cursor-pointer"
                        title="Re-probe"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingKey(key)}
                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete API key "${key.keyName}"?`)) {
                            deleteKeyMutation.mutate(key.id)
                          }
                        }}
                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Key Modal (Pre-selected with this Folder) */}
      <Modal
        isOpen={isAddKeyModalOpen}
        onClose={() => setIsAddKeyModalOpen(false)}
        title={`Add API Key to ${currentFolder?.name || 'Folder'}`}
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newKeyName.trim() || !newKeySecret.trim()) {
              toast.error('Key Name and Secret are required')
              return
            }
            createKeyMutation.mutate({
              keyName: newKeyName.trim(),
              providerCode: newKeyProvider,
              apiKey: newKeySecret.trim(),
              accountEmail: newKeyAccountEmail.trim() || undefined,
              accountPhone: newKeyAccountPhone.trim() || undefined,
              description: newKeyDesc.trim() || undefined,
              folderId: isUnassigned ? undefined : folderId,
              isMonitoringEnabled: newKeyMonitor,
              monitoringFrequency: 60,
            })
          }}
          className="space-y-4"
        >
          {/* Category Switcher: AI Models vs Platform & Cloud */}
          <div className="flex p-1 bg-muted rounded-xl border border-border mb-2">
            <button
              type="button"
              onClick={() => {
                setVaultCategory('ai')
                if (!AI_PROVIDERS.includes(newKeyProvider.toLowerCase())) {
                  setNewKeyProvider('openai')
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                vaultCategory === 'ai'
                  ? 'bg-card dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-500/40 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>AI Foundation Model Key</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVaultCategory('platform')
                if (AI_PROVIDERS.includes(newKeyProvider.toLowerCase())) {
                  setNewKeyProvider('elevenlabs')
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                vaultCategory === 'platform'
                  ? 'bg-card dark:bg-sky-600/30 text-sky-700 dark:text-sky-300 border border-sky-500/40 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Platform & Cloud Secret</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={vaultCategory === 'platform' ? 'Secret / Identifier Name' : 'Key Identifier Name'}
              placeholder={vaultCategory === 'platform' ? 'e.g. Production AWS S3 Key' : 'e.g. Production GPT-4o Enterprise'}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {vaultCategory === 'platform' ? 'Platform / Service' : 'AI Model Provider'}
              </label>
              {vaultCategory === 'ai' ? (
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                >
                  <option value="openai">OpenAI (GPT-4o, o1, o3-mini)</option>
                  <option value="gemini">Google Gemini (1.5 Pro, 2.0 Flash)</option>
                  <option value="anthropic">Anthropic Claude (3.5 Sonnet, Opus)</option>
                  <option value="groq">Groq LPU (Llama 3.3, Mixtral)</option>
                  <option value="deepseek">DeepSeek (V3, R1 Reasoner)</option>
                  <option value="together">Together AI (Open Models)</option>
                  <option value="openrouter">OpenRouter Unified Gateway</option>
                </select>
              ) : (
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-sky-500"
                >
                  <optgroup label="🎙️ Media & Audio Services">
                    <option value="elevenlabs">ElevenLabs Speech & Voice</option>
                    <option value="cloudinary">Cloudinary Media & CDN</option>
                  </optgroup>
                  <optgroup label="☁️ Cloud & Infrastructure">
                    <option value="aws">AWS (Amazon Web Services)</option>
                    <option value="googlecloud">Google Cloud Platform (GCP)</option>
                    <option value="cloudflare">Cloudflare API & Edge</option>
                  </optgroup>
                  <optgroup label="⚡ Databases & Caching">
                    <option value="redis">Redis (In-Memory Key/Value)</option>
                  </optgroup>
                  <optgroup label="🛠️ Developer, Messaging & Payments">
                    <option value="stripe">Stripe Secret Key</option>
                    <option value="github">GitHub Personal Access Token</option>
                  </optgroup>
                  <optgroup label="🌐 Custom & Other">
                    <option value="other">Other / Custom Platform API</option>
                  </optgroup>
                </select>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Secret API Key / Token
            </label>
            <input
              type="password"
              placeholder="sk-... or secret token"
              value={newKeySecret}
              onChange={(e) => setNewKeySecret(e.target.value)}
              required
              className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500"
            />
            <span className="text-[10px] text-muted-foreground block">
              Encrypted with military-grade AES-256 before storing.
            </span>
          </div>

          {/* Account Email & Phone (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                <span>Account Email</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. dev@company.com"
                  value={newKeyAccountEmail}
                  onChange={(e) => setNewKeyAccountEmail(e.target.value)}
                  className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-purple-500 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none transition-all"
                />
                <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={newKeyAccountPhone}
                  onChange={(e) => setNewKeyAccountPhone(e.target.value)}
                  className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-purple-500 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <Input
            label="Description (Optional)"
            placeholder="e.g. Used for customer chatbot service in production"
            value={newKeyDesc}
            onChange={(e) => setNewKeyDesc(e.target.value)}
          />

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
            <span className="text-xs text-purple-300 font-medium">
              Target Folder: <strong>{currentFolder?.name || 'Workspace'}</strong>
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded">
              Auto-Assigned
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createKeyMutation.isPending}>
              Securely Vault Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Workspace Folder"
        maxWidth="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!renameValue.trim() || isUnassigned) return
            updateFolderMutation.mutate({ id: folderId, name: renameValue.trim() })
          }}
          className="space-y-4"
        >
          <Input
            label="Folder Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updateFolderMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Key Modal */}
      <Modal
        isOpen={!!editingKey}
        onClose={() => setEditingKey(null)}
        title="Edit API Key Details"
        maxWidth="md"
      >
        {editingKey && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateKeyMutation.mutate({
                id: editingKey.id,
                payload: {
                  keyName: editingKey.keyName,
                  description: editingKey.description,
                  accountEmail: editingKey.accountEmail || undefined,
                  accountPhone: editingKey.accountPhone || undefined,
                  folderId: editingKey.folderId || undefined,
                },
              })
            }}
            className="space-y-4"
          >
            <Input
              label="Key Name"
              value={editingKey.keyName}
              onChange={(e) => setEditingKey({ ...editingKey, keyName: e.target.value })}
              required
            />

            {/* Account Email & Phone (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Account Email</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. dev@company.com"
                    value={editingKey.accountEmail || ''}
                    onChange={(e) => setEditingKey({ ...editingKey, accountEmail: e.target.value })}
                    className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-purple-500 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none transition-all"
                  />
                  <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={editingKey.accountPhone || ''}
                    onChange={(e) => setEditingKey({ ...editingKey, accountPhone: e.target.value })}
                    className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-purple-500 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none transition-all"
                  />
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <Input
              label="Description"
              value={editingKey.description || ''}
              onChange={(e) => setEditingKey({ ...editingKey, description: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground block">Workspace Folder</label>
              <select
                value={editingKey.folderId || ''}
                onChange={(e) => setEditingKey({ ...editingKey, folderId: e.target.value || null })}
                className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-foreground"
              >
                <option value="">Root Vault (Unassigned)</option>
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingKey(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={updateKeyMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Inspect Models Modal */}
      <Modal
        isOpen={!!inspectingKeyForModels}
        onClose={() => setInspectingKeyForModels(null)}
        title={`${inspectingKeyForModels?.keyName || 'Key'} - Working Models & Probes`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/80 dark:bg-zinc-900 border border-border">
            <div className="flex items-center gap-2">
              <ProviderBadge provider={inspectingKeyForModels?.providerCode || ''} />
              <span className="font-bold text-xs text-foreground">{inspectingKeyForModels?.keyName}</span>
            </div>
            <StatusBadge status={inspectingKeyForModels?.status || ''} />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {isLoadingModels ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Probing models...</div>
            ) : keyModels.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active model telemetry recorded for this key yet. Run a validation probe to discover supported models.
              </div>
            ) : (
              keyModels.map((m: any) => (
                <div
                  key={m.id || m.modelName}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-card dark:bg-zinc-950 border border-border text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-foreground truncate">{m.displayName || m.modelName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{m.modelName}</span>
                  </div>
                  {m.latencyMs && (
                    <span className="text-[10px] font-mono text-muted-foreground">{m.latencyMs}ms</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
