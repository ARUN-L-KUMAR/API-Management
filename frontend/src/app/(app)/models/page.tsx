'use client'

import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  RefreshCw, Database, Search, Zap, CheckCircle2, XCircle, 
  ExternalLink, Terminal, Sparkles, SlidersHorizontal, Cpu, ArrowUpRight,
  Copy, Check, Filter, Eye, EyeOff, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { ModelVerificationBadge, ProviderBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardsSkeleton } from '@/components/ui/Skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { toast } from 'sonner'

const AI_PROVIDERS = [
  'openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'together', 'openrouter', 'opencode', 'doubleworld'
]

export default function ModelsPage() {
  const queryClient = useQueryClient()
  const { showFailedModels, showAllModels, setShowFailedModels, setShowAllModels } = useStore()

  const [providerFilter, setProviderFilter] = useState('')
  const [keyIdFilter, setKeyIdFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [hideEmptyKeys, setHideEmptyKeys] = useState(true)

  const { data: rawKeys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  // Filter strictly to AI Model Keys
  const aiKeys = useMemo(() => {
    return rawKeys.filter((k: any) => AI_PROVIDERS.includes(k.providerCode?.toLowerCase()))
  }, [rawKeys])

  // Filter keys based on status tab: Working Only vs Show Failed vs Show All
  const statusFilteredKeys = useMemo(() => {
    if (!showAllModels && !showFailedModels) {
      // Working Only: Strictly keys where status is Working
      return aiKeys.filter((k: any) => k.status?.toLowerCase() === 'working')
    }
    if (!showAllModels && showFailedModels) {
      // Show Failed: Keys where status is NOT Working (e.g. Invalid, Error)
      return aiKeys.filter((k: any) => k.status?.toLowerCase() !== 'working')
    }
    // Show All: All AI keys
    return aiKeys
  }, [aiKeys, showAllModels, showFailedModels])

  // Available providers from the filtered keys
  const providers = useMemo(() => {
    const codes = new Set(statusFilteredKeys.map((k: any) => k.providerCode.toLowerCase()))
    return Array.from(codes).sort()
  }, [statusFilteredKeys])

  // Apply provider filter
  const filteredByProvider = useMemo(() => {
    if (!providerFilter) return statusFilteredKeys
    return statusFilteredKeys.filter((k: any) => k.providerCode.toLowerCase() === providerFilter.toLowerCase())
  }, [statusFilteredKeys, providerFilter])

  // Apply specific key filter
  const displayKeys = useMemo(() => {
    if (keyIdFilter) return filteredByProvider.filter((k: any) => k.id === keyIdFilter)
    return filteredByProvider
  }, [filteredByProvider, keyIdFilter])

  const totalWorkingKeys = useMemo(() => {
    return aiKeys.filter((k: any) => k.status?.toLowerCase() === 'working').length
  }, [aiKeys])

  const totalFailedKeys = useMemo(() => {
    return aiKeys.filter((k: any) => k.status?.toLowerCase() !== 'working').length
  }, [aiKeys])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Subheader */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/60 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">AI Models Catalog</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400 font-mono">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dynamic model discovery matrix inspected and verified across your active provider credentials.
          </p>
        </div>

        {/* Quick filters: Provider & Key dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setKeyIdFilter('') }}
            className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[140px]"
          >
            <option value="">All Providers ({providers.length})</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={keyIdFilter}
            onChange={(e) => setKeyIdFilter(e.target.value)}
            className="bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[140px]"
            disabled={!providerFilter}
          >
            <option value="">All Keys ({filteredByProvider.length})</option>
            {filteredByProvider.map((k: any) => (
              <option key={k.id} value={k.id}>{k.keyName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4 overflow-y-auto flex-1">
        {/* Filter & Search Bar */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3">
          {/* Left: Model Status Tabs in user-requested order */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted dark:bg-zinc-900/80 border border-border dark:border-zinc-800 text-xs font-semibold">
            {/* 1. Show ALL */}
            <button
              onClick={() => { setShowAllModels(true); setShowFailedModels(false) }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                showAllModels
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Show ALL</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-black/40">
                {aiKeys.length}
              </span>
            </button>

            {/* 2. Available Model */}
            <button
              onClick={() => { setShowAllModels(false); setShowFailedModels(false) }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                !showAllModels && !showFailedModels
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Available Model</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-black/40">
                {totalWorkingKeys}
              </span>
            </button>

            {/* 3. Failed/Invalid */}
            <button
              onClick={() => { setShowAllModels(false); setShowFailedModels(true) }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                !showAllModels && showFailedModels
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Failed/Invalid</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-black/40">
                {totalFailedKeys}
              </span>
            </button>
          </div>

          {/* Right: Hide empty keys toggle + Search Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle: Hide Empty Keys */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={hideEmptyKeys}
                onChange={(e) => setHideEmptyKeys(e.target.checked)}
                className="rounded border-border bg-card text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-foreground">Hide keys with 0 models</span>
            </label>

            {/* Search Model Name */}
            <div className="relative min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search model by name or ID (e.g. gpt-4o, claude)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-card dark:bg-zinc-900/80 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Model Cards Grid */}
        {isLoadingKeys ? (
          <CardsSkeleton count={6} />
        ) : aiKeys.length === 0 ? (
          <EmptyState
            icon={<Database className="w-12 h-12 text-purple-400" />}
            title="No AI API Keys Available"
            description="Vault a valid AI model key (OpenAI, Gemini, Anthropic, Groq, DeepSeek) in the Keys Vault to automatically probe and catalog models."
          />
        ) : displayKeys.length === 0 ? (
          <EmptyState
            icon={<Database className="w-12 h-12 text-purple-400" />}
            title={
              !showAllModels && !showFailedModels
                ? 'No Available Models Found'
                : !showAllModels && showFailedModels
                ? 'No Failed/Invalid Keys Found'
                : 'No Keys Match Your Filter'
            }
            description={
              !showAllModels && !showFailedModels
                ? 'No keys have "Working" status for the selected provider. Validate your keys to restore access.'
                : 'All keys are currently verified and operating normally.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKeys.map((key: any) => (
              <KeyModelsCard
                key={key.id}
                apiKey={key}
                showFailed={showFailedModels}
                showAll={showAllModels}
                searchQuery={searchQuery}
                hideEmpty={hideEmptyKeys}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KeyModelsCard({
  apiKey,
  showFailed,
  showAll,
  searchQuery,
  hideEmpty,
}: {
  apiKey: any
  showFailed: boolean
  showAll: boolean
  searchQuery: string
  hideEmpty: boolean
}) {
  const queryClient = useQueryClient()
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null)

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['key-models-list', apiKey.id, showFailed, showAll],
    queryFn: () => api.getKeyModels(apiKey.id, showFailed, showAll),
  })

  const validateKeyMutation = useMutation({
    mutationFn: () => api.validateKey(apiKey.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key-models-list', apiKey.id] })
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      toast.success(`Dispatched model validation probe for ${apiKey.keyName}`)
    },
    onError: (err: any) => toast.error(err.message),
  })

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (m: any) =>
        m.modelName.toLowerCase().includes(q) ||
        (m.displayName && m.displayName.toLowerCase().includes(q))
    )
  }, [list, searchQuery])

  const copyModelName = (name: string, id: string) => {
    navigator.clipboard.writeText(name)
    setCopiedModelId(id)
    toast.success(`Copied "${name}" to clipboard`)
    setTimeout(() => setCopiedModelId(null), 2000)
  }

  // If hideEmpty is enabled and there are no models after loading, return null to eliminate gaps!
  if (hideEmpty && !isLoading && filteredList.length === 0) {
    return null
  }

  return (
    <Card className="flex flex-col h-[380px] overflow-hidden border border-border shadow-lg hover:border-purple-500/40 transition-all">
      <CardHeader className="bg-muted/40 pb-3 border-b border-border flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ProviderBadge provider={apiKey.providerCode} />
            <span className={`text-[10px] font-mono font-semibold ${
              apiKey.status === 'Working' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {apiKey.status}
            </span>
          </div>
          <h4 className="text-foreground font-bold text-sm truncate" title={apiKey.keyName}>
            {apiKey.keyName}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => validateKeyMutation.mutate()}
            disabled={validateKeyMutation.isPending}
            className="p-1 hover:bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 rounded-md transition-colors cursor-pointer"
            title="Re-probe models for this key"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${validateKeyMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-[10px] bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
            {list.length} Discovered
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2 p-3 pt-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
            <span>Scanning model catalog endpoints...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs text-center p-4">
            <Cpu className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <span>
              {list.length === 0
                ? 'No models discovered for this key.'
                : 'No models match your search query.'}
            </span>
            {list.length === 0 && (
              <button
                onClick={() => validateKeyMutation.mutate()}
                className="mt-2 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
              >
                Run Validation Probe →
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item: any) => {
            const isCopied = copiedModelId === item.id
            const isFast = item.latencyMs > 0 && item.latencyMs < 350

            return (
              <div
                key={item.id}
                className="p-3 bg-muted/40 dark:bg-zinc-950/70 border border-border hover:border-purple-500/40 rounded-xl flex flex-col gap-2 text-xs transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-foreground block truncate leading-tight" title={item.displayName || item.modelName}>
                      {item.displayName || item.modelName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-[160px]">
                        {item.modelName}
                      </span>
                      <button
                        onClick={() => copyModelName(item.modelName, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-opacity cursor-pointer p-0.5"
                        title="Copy model slug"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <ModelVerificationBadge status={item.verificationStatus} />
                    {item.latencyMs > 0 && (
                      <span className={`text-[10px] font-mono font-bold block mt-1 ${isFast ? 'text-emerald-400' : 'text-purple-400'}`}>
                        {item.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action bar */}
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-900/80 text-[10px]">
                  <span className="text-zinc-600 font-mono">Status: {item.verificationStatus}</span>
                  <Link
                    href={`/playground?model=${encodeURIComponent(item.modelName)}&modelId=${item.id}&keyId=${apiKey.id}`}
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold cursor-pointer group-hover:underline"
                  >
                    <span>Test Prompt</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
