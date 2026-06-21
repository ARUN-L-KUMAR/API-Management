'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Key, Folder, Plus, Search, RefreshCw, Eye, EyeOff, Clipboard, Trash2, Edit2,
  CheckCircle, Server, Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'

export default function KeysPage() {
  const queryClient = useQueryClient()
  const {
    activeFolderId, activeTagIds, searchQuery, providerFilter, statusFilter,
    setSearchQuery, setProviderFilter, setStatusFilter, resetFilters,
  } = useStore()

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<any | null>(null)
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([])

  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyProvider, setNewKeyProvider] = useState('openai')
  const [newKeySecret, setNewKeySecret] = useState('')
  const [newKeyDesc, setNewKeyDesc] = useState('')
  const [newKeyFolder, setNewKeyFolder] = useState('')
  const [newKeyTags, setNewKeyTags] = useState<string[]>([])
  const [newKeyMonitor, setNewKeyMonitor] = useState(true)
  const [newKeyFrequency, setNewKeyFrequency] = useState(60)
  const [newFolderName, setNewFolderName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')

  const { data: keys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ['keys', activeFolderId, providerFilter, statusFilter],
    queryFn: () => api.getKeys(activeFolderId || undefined, providerFilter || undefined, statusFilter || undefined),
  })

  const { data: folders = [] } = useQuery({ queryKey: ['folders'], queryFn: api.getFolders })
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: api.getTags })

  const createKeyMutation = useMutation({
    mutationFn: api.createKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setIsKeyModalOpen(false)
      resetKeyForm()
      toast.success('API Key added & validation queued')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateKeyMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => api.updateKey(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setEditingKey(null)
      toast.success('API Key updated')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: api.deleteKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      toast.success('API Key removed')
    },
  })

  const validateKeyMutation = useMutation({
    mutationFn: api.validateKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success('Key validation re-triggered')
    },
  })

  const createFolderMutation = useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setIsFolderModalOpen(false)
      setNewFolderName('')
      toast.success('Folder created successfully')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.createTag(data.name, data.color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setIsTagModalOpen(false)
      setNewTagName('')
      toast.success('Tag created')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: api.bulkDeleteKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setSelectedKeyIds([])
      toast.success('Bulk delete completed')
    },
  })

  const bulkValidateMutation = useMutation({
    mutationFn: api.bulkValidateKeys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      setSelectedKeyIds([])
      toast.success('Bulk validation triggered')
    },
  })

  const resetKeyForm = () => {
    setNewKeyName('')
    setNewKeyProvider('openai')
    setNewKeySecret('')
    setNewKeyDesc('')
    setNewKeyFolder('')
    setNewKeyTags([])
    setNewKeyMonitor(true)
    setNewKeyFrequency(60)
  }

  const filteredKeys = keys.filter((key: any) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      key.keyName.toLowerCase().includes(query) ||
      key.providerCode.toLowerCase().includes(query) ||
      (key.description && key.description.toLowerCase().includes(query))
    const matchesTags =
      activeTagIds.length === 0 ||
      activeTagIds.every((tagId) => key.tags.some((t: any) => t.id === tagId))
    return matchesSearch && matchesTags
  })

  const totalKeys = keys.length
  const workingKeysCount = keys.filter((k: any) => k.status === 'Working').length
  const monitoringCount = keys.filter((k: any) => k.isMonitoringEnabled).length
  const uniqueProviders = new Set(keys.map((k: any) => k.providerCode)).size

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim() || !newKeySecret.trim()) {
      toast.error('Name and API key secret are required')
      return
    }
    createKeyMutation.mutate({
      keyName: newKeyName,
      providerCode: newKeyProvider,
      apiKey: newKeySecret,
      description: newKeyDesc || undefined,
      folderId: newKeyFolder || undefined,
      tagIds: newKeyTags.length > 0 ? newKeyTags : undefined,
      isMonitoringEnabled: newKeyMonitor,
      monitoringFrequency: newKeyFrequency,
    })
  }

  const handleUpdateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKey) return
    updateKeyMutation.mutate({
      id: editingKey.id,
      payload: {
        keyName: editingKey.keyName,
        description: editingKey.description,
        folderId: editingKey.folderId || null,
        isMonitoringEnabled: editingKey.isMonitoringEnabled,
        monitoringFrequency: editingKey.monitoringFrequency,
        tagIds: editingKey.tagIds,
      },
    })
  }

  const handleBulkDelete = () => {
    if (selectedKeyIds.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedKeyIds.length} keys?`)) {
      bulkDeleteMutation.mutate(selectedKeyIds)
    }
  }

  const handleBulkValidate = () => {
    if (selectedKeyIds.length === 0) return
    bulkValidateMutation.mutate(selectedKeyIds)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(keys, null, 2))
    const a = document.createElement('a')
    a.setAttribute('href', dataStr)
    a.setAttribute('download', `ai-registry-export-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.success('JSON export downloaded')
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Key Name', 'Provider', 'Status', 'Monitoring Enabled', 'Frequency', 'Created At']
    const rows = keys.map((k: any) => [
      k.id, k.keyName, k.providerCode, k.status,
      k.isMonitoringEnabled ? 'Yes' : 'No', k.monitoringFrequency,
      new Date(k.createdAt).toLocaleDateString(),
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.map((val: any) => `"${val}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.setAttribute('href', encodeURI(csvContent))
    a.setAttribute('download', `ai-registry-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.success('CSV export downloaded')
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-4 lg:p-6 border-b border-[#1f1f23] flex items-center justify-between shrink-0 bg-zinc-950/40">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">AI Provider Registry Dashboard</h2>
          <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">Continuous health probe & dynamic model discovery console</p>
        </div>
        <Button onClick={() => setIsKeyModalOpen(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> Add API Key
        </Button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 p-4 lg:p-6 shrink-0 border-b border-[#1f1f23] bg-zinc-950/20">
        <div className="glass-panel p-3 lg:p-4 rounded-xl flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Key className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase block truncate">Total Vaulted Keys</span>
            <h3 className="text-base lg:text-lg font-black text-white mt-0.5">{totalKeys}</h3>
          </div>
        </div>
        <div className="glass-panel p-3 lg:p-4 rounded-xl flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase block truncate">Working Keys</span>
            <h3 className="text-base lg:text-lg font-black text-white mt-0.5">{workingKeysCount} / {totalKeys}</h3>
          </div>
        </div>
        <div className="glass-panel p-3 lg:p-4 rounded-xl flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Server className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase block truncate">Active Providers</span>
            <h3 className="text-base lg:text-lg font-black text-white mt-0.5">{uniqueProviders}</h3>
          </div>
        </div>
        <div className="glass-panel p-3 lg:p-4 rounded-xl flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-cyan-600/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase block truncate">Monitoring Cron</span>
            <h3 className="text-base lg:text-lg font-black text-white mt-0.5">{monitoringCount} active</h3>
          </div>
        </div>
      </section>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-3 rounded-xl">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <select
              value={providerFilter || ''}
              onChange={(e) => setProviderFilter(e.target.value || null)}
              className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
              <option value="deepseek">DeepSeek</option>
              <option value="together">Together AI</option>
              <option value="groq">Groq</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="doubleworld">DoubleWorld</option>
              <option value="opencode">OpenCode</option>
              {/* <option value="cloudinary">Cloudinary</option>
              <option value="telegram">Telegram</option>
              <option value="googlecloud">Google Cloud</option> */}
              <option value="other">Other</option>
            </select>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="working">Working</option>
              <option value="invalid">Invalid</option>
              <option value="stored">Stored</option>
              <option value="quota exceeded">Quota Exceeded</option>
              <option value="rate limited">Rate Limited</option>
              <option value="unknown">Unknown</option>
            </select>
            {(searchQuery || providerFilter || statusFilter) && (
              <button onClick={resetFilters} className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
                Reset Filters
              </button>
            )}
            <div className="flex items-center gap-2 border-l border-zinc-800/80 pl-3 shrink-0">
              <button onClick={exportToJSON} className="text-[10px] hover:text-purple-400 font-semibold text-zinc-500 px-2 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded transition-all cursor-pointer">JSON</button>
              <button onClick={exportToCSV} className="text-[10px] hover:text-purple-400 font-semibold text-zinc-500 px-2 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded transition-all cursor-pointer">CSV</button>
            </div>
          </div>
          {selectedKeyIds.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 border border-zinc-800 rounded-lg shrink-0">
              <span className="text-[10px] text-zinc-400 font-bold">{selectedKeyIds.length} Selected</span>
              <button onClick={handleBulkValidate} className="text-[10px] hover:text-purple-400 font-semibold text-zinc-300 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700/50 rounded cursor-pointer">Revalidate</button>
              <button onClick={handleBulkDelete} className="text-[10px] hover:text-red-400 font-semibold text-zinc-300 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700/50 rounded cursor-pointer">Delete</button>
            </div>
          )}
        </div>

        {/* Table */}
        {isLoadingKeys ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredKeys.length === 0 ? (
          <EmptyState
            icon={<Key className="w-12 h-12" />}
            title="No API Keys Found"
            description="No keys match your current filter parameters or none have been added yet."
            action={{ label: 'Add Your First Key', onClick: () => setIsKeyModalOpen(true) }}
          />
        ) : (
          <div className="glass-panel rounded-xl overflow-hidden border border-[#1f1f23] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-950/40 border-b border-[#1f1f23] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedKeyIds.length === filteredKeys.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedKeyIds(filteredKeys.map((k: any) => k.id))
                        else setSelectedKeyIds([])
                      }}
                      className="rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Key / Provider</th>
                  <th className="p-4">Secret Status</th>
                  <th className="p-4">Folder & Tags</th>
                  <th className="p-4">Monitoring</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23] text-xs">
                {filteredKeys.map((key: any) => {
                  const isSecretVisible = revealedKeyId === key.id
                  return (
                    <tr key={key.id} className="hover:bg-zinc-900/35 transition-colors group">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedKeyIds.includes(key.id)}
                          onChange={() => setSelectedKeyIds((prev) => prev.includes(key.id) ? prev.filter((i) => i !== key.id) : [...prev, key.id])}
                          className="rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <h4 className="font-black text-white text-base uppercase tracking-wider leading-none">{key.providerCode}</h4>
                          <span className="text-xs text-zinc-400 mt-1 block">{key.keyName}</span>
                          {key.description && <span className="text-[10px] text-zinc-500 truncate max-w-[200px] mt-0.5 block">{key.description}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={key.status} />
                          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                            <span>{isSecretVisible ? key.plainApiKey || 'No cached secret' : '••••••••••••••••'}</span>
                            <button
                              onClick={() => {
                                if (isSecretVisible) setRevealedKeyId(null)
                                else { api.getKey(key.id).then((res) => { key.plainApiKey = res.plainApiKey; setRevealedKeyId(key.id) }) }
                              }}
                              className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => { api.getKey(key.id).then((res) => res.plainApiKey && copyToClipboard(res.plainApiKey)) }}
                              className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5">
                          {key.folderId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-medium text-zinc-300">
                              <Folder className="w-3 h-3 text-zinc-400" /> {folders.find((f: any) => f.id === key.folderId)?.name || 'Folder'}
                            </span>
                          ) : <span className="text-[10px] text-zinc-600 font-medium">No folder</span>}
                          <div className="flex flex-wrap gap-1">
                            {key.tags.map((tag: any) => (
                              <span key={tag.id} className="px-2 py-0.5 rounded-full text-[9px] font-semibold border" style={{ borderColor: `${tag.color}35`, backgroundColor: `${tag.color}10`, color: tag.color }}>{tag.name}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={key.isMonitoringEnabled}
                              onChange={(e) => { updateKeyMutation.mutate({ id: key.id, payload: { isMonitoringEnabled: e.target.checked } }) }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white" />
                          </label>
                          {key.isMonitoringEnabled && <span className="text-[10px] text-zinc-500 font-mono">Every {key.monitoringFrequency}m</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => validateKeyMutation.mutate(key.id)} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer" title="Validate"><RefreshCw className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingKey({ ...key, tagIds: key.tags.map((t: any) => t.id) })} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 rounded cursor-pointer" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm('Delete this API Key permanently?')) deleteKeyMutation.mutate(key.id) }} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      <Modal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} title="Register API Credentials">
        <form onSubmit={handleCreateKey} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Key Identifier Name" placeholder="e.g. OpenAI Backup Key" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} required />
            <Select label="AI Endpoint Provider" value={newKeyProvider} onChange={(e) => setNewKeyProvider(e.target.value)}>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini AI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
              <option value="deepseek">DeepSeek</option>
              <option value="together">Together AI</option>
              <option value="groq">Groq</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="doubleworld">DoubleWorld AI</option>
              <option value="opencode">OpenCode</option>
              {/* <option value="cloudinary">Cloudinary</option>
              <option value="telegram">Telegram Bot</option>
              <option value="googlecloud">Google Cloud API</option> */}
              <option value="other">Other</option>
            </Select>
          </div>
          <Input label="API Key Secret" type="password" placeholder="Paste your provider api key here" value={newKeySecret} onChange={(e) => setNewKeySecret(e.target.value)} required className="font-mono" />
          <Input label="Short Description" placeholder="Optional usage context notes..." value={newKeyDesc} onChange={(e) => setNewKeyDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Select Folder" value={newKeyFolder} onChange={(e) => setNewKeyFolder(e.target.value)}>
              <option value="">No Folder (Unassigned)</option>
              {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Map Custom Tags</label>
              <div className="flex flex-wrap gap-1 border border-[#1f1f23] bg-zinc-900 p-2 rounded-lg max-h-[40px] overflow-y-auto">
                {tags.length === 0 ? (
                  <span className="text-[10px] text-zinc-600">No tags configured</span>
                ) : (
                  tags.map((tag: any) => {
                    const isChecked = newKeyTags.includes(tag.id)
                    return (
                      <div key={tag.id} onClick={() => setNewKeyTags((prev) => prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id])}
                        className="px-2 py-0.5 rounded text-[9px] cursor-pointer border select-none transition-all"
                        style={{ borderColor: isChecked ? tag.color : 'rgba(31, 31, 35, 0.5)', backgroundColor: isChecked ? `${tag.color}20` : 'transparent', color: isChecked ? tag.color : '#a1a1aa' }}
                      >{tag.name}</div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-[#1f1f23] pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className={`relative inline-flex items-center ${newKeyProvider === 'other' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="checkbox" checked={newKeyMonitor} onChange={(e) => setNewKeyMonitor(e.target.checked)} disabled={newKeyProvider === 'other'} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white" />
              </label>
              <div>
                <span className="text-[10px] font-bold text-white block">Continuous Monitoring</span>
                <span className="text-[9px] text-zinc-500">{newKeyProvider === 'other' ? 'Not available for generic keys' : 'Auto trigger health validation'}</span>
              </div>
            </div>
            {newKeyMonitor && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500">Frequency:</span>
                <select value={newKeyFrequency} onChange={(e) => setNewKeyFrequency(Number(e.target.value))} className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-2 py-1 focus:outline-none focus:border-purple-500">
                  <option value="15">15 Min</option>
                  <option value="30">30 Min</option>
                  <option value="60">1 Hour</option>
                  <option value="360">6 Hours</option>
                  <option value="720">12 Hours</option>
                  <option value="1440">24 Hours</option>
                </select>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" loading={createKeyMutation.isPending}>
            Register Key
          </Button>
        </form>
      </Modal>

      {/* Edit Key Modal */}
      <Modal isOpen={!!editingKey} onClose={() => setEditingKey(null)} title="Edit API Key Metadata">
        <form onSubmit={handleUpdateKey} className="space-y-4">
          <Input label="Key Name" value={editingKey?.keyName || ''} onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, keyName: e.target.value } : null)} required />
          <Input label="Description" value={editingKey?.description || ''} onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, description: e.target.value } : null)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Folder" value={editingKey?.folderId || ''} onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, folderId: e.target.value || null } : null)}>
              <option value="">No Folder</option>
              {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Map Custom Tags</label>
              <div className="flex flex-wrap gap-1 border border-[#1f1f23] bg-zinc-900 p-2 rounded-lg max-h-[40px] overflow-y-auto">
                {tags.map((tag: any) => {
                  const isChecked = editingKey?.tagIds?.includes(tag.id)
                  return (
                    <div key={tag.id} onClick={() => {
                      if (!editingKey) return
                      const newTags = isChecked ? editingKey.tagIds.filter((t: string) => t !== tag.id) : [...editingKey.tagIds, tag.id]
                      setEditingKey({ ...editingKey, tagIds: newTags })
                    }}
                      className="px-2 py-0.5 rounded text-[9px] cursor-pointer border select-none transition-all"
                      style={{ borderColor: isChecked ? tag.color : 'rgba(31, 31, 35, 0.5)', backgroundColor: isChecked ? `${tag.color}20` : 'transparent', color: isChecked ? tag.color : '#a1a1aa' }}
                    >{tag.name}</div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="border-t border-[#1f1f23] pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={editingKey?.isMonitoringEnabled || false} onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, isMonitoringEnabled: e.target.checked } : null)} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white" />
              </label>
              <span className="text-[10px] font-bold text-white">Monitoring Probe</span>
            </div>
            {editingKey?.isMonitoringEnabled && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500">Frequency:</span>
                <select value={editingKey?.monitoringFrequency || 60} onChange={(e) => setEditingKey((prev: any) => prev ? { ...prev, monitoringFrequency: Number(e.target.value) } : null)} className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-2 py-1 focus:outline-none focus:border-purple-500">
                  <option value="15">15 Min</option>
                  <option value="30">30 Min</option>
                  <option value="60">1 Hour</option>
                  <option value="360">6 Hours</option>
                  <option value="720">12 Hours</option>
                  <option value="1440">24 Hours</option>
                </select>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" loading={updateKeyMutation.isPending}>Save Changes</Button>
        </form>
      </Modal>

      {/* Folder Modal */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Create Folder" maxWidth="sm">
        <form onSubmit={(e) => { e.preventDefault(); if (!newFolderName.trim()) return; createFolderMutation.mutate(newFolderName) }} className="space-y-4">
          <Input label="Folder Name" placeholder="e.g. Client A, Testing, Production" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} required />
          <Button type="submit" className="w-full" loading={createFolderMutation.isPending}>Create Folder</Button>
        </form>
      </Modal>

      {/* Tag Modal */}
      <Modal isOpen={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} title="Add Tag" maxWidth="sm">
        <form onSubmit={(e) => { e.preventDefault(); if (!newTagName.trim()) return; createTagMutation.mutate({ name: newTagName, color: newTagColor }) }} className="space-y-4">
          <Input label="Tag Label Name" placeholder="e.g. backup, experimental" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} required />
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Hex Color Accent</label>
            <div className="flex items-center gap-3">
              <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-10 h-8 bg-transparent border-0 cursor-pointer p-0 shrink-0" />
              <input type="text" required value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="flex-1 bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-3 py-2 focus:outline-none focus:border-purple-500 font-mono" />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={createTagMutation.isPending}>Create Tag</Button>
        </form>
      </Modal>
    </div>
  )
}
