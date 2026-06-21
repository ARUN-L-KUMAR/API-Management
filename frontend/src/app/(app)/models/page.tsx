'use client'

import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Database } from 'lucide-react'
import { api } from '@/lib/api'
import { useStore } from '@/store/useStore'
import { ModelVerificationBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardsSkeleton } from '@/components/ui/Skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export default function ModelsPage() {
  const { showFailedModels, showAllModels, setShowFailedModels, setShowAllModels } = useStore()

  const [providerFilter, setProviderFilter] = useState('')
  const [keyIdFilter, setKeyIdFilter] = useState('')

  const { data: keys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  const providers = useMemo(() => {
    const codes = new Set(keys.map((k: any) => k.providerCode))
    return Array.from(codes).sort()
  }, [keys])

  const filteredByProvider = useMemo(() => {
    if (!providerFilter) return keys
    return keys.filter((k: any) => k.providerCode === providerFilter)
  }, [keys, providerFilter])

  const displayKeys = useMemo(() => {
    if (keyIdFilter) return keys.filter((k: any) => k.id === keyIdFilter)
    if (providerFilter) return filteredByProvider
    return keys
  }, [keys, providerFilter, keyIdFilter, filteredByProvider])

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-4 lg:p-6 border-b border-[#1f1f23] shrink-0">
        <h2 className="text-lg font-bold text-white tracking-tight">Discovered AI Models Catalog</h2>
        <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">Models identified and verified via your valid active API keys.</p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setKeyIdFilter('') }}
            className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={keyIdFilter}
            onChange={(e) => setKeyIdFilter(e.target.value)}
            className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
            disabled={!providerFilter}
          >
            <option value="">All Keys</option>
            {filteredByProvider.map((k: any) => (
              <option key={k.id} value={k.id}>{k.keyName}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-4 overflow-y-auto flex-1">
        {/* Filter Tabs */}
        <Card hover={false}>
          <CardHeader>
            <div>
              <h3 className="text-white font-bold text-sm">Model Filters</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Select which models to display</p>
            </div>
            <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => { setShowAllModels(false); setShowFailedModels(false) }}
                className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${(!showAllModels && !showFailedModels) ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Working Only
              </button>
              <button
                onClick={() => { setShowAllModels(false); setShowFailedModels(true) }}
                className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${(!showAllModels && showFailedModels) ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Show Failed
              </button>
              <button
                onClick={() => { setShowAllModels(true); setShowFailedModels(false) }}
                className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${showAllModels ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Show All
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Model Cards */}
        {isLoadingKeys ? (
          <CardsSkeleton count={6} />
        ) : keys.length === 0 ? (
          <EmptyState
            icon={<Database className="w-12 h-12" />}
            title="No API Keys Available"
            description="Please add a valid working API key to discover and inspect supported models."
          />
        ) : displayKeys.length === 0 ? (
          <EmptyState
            icon={<Database className="w-12 h-12" />}
            title="No matching keys"
            description="No keys match the selected filter."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayKeys.map((key: any) => (
              <KeyModelsCard key={key.id} apiKey={key} showFailed={showFailedModels} showAll={showAllModels} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KeyModelsCard({ apiKey, showFailed, showAll }: { apiKey: any; showFailed: boolean; showAll: boolean }) {
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['key-models-list', apiKey.id, showFailed, showAll],
    queryFn: () => api.getKeyModels(apiKey.id, showFailed, showAll),
  })

  return (
    <Card className="flex flex-col h-[320px]">
      <CardHeader>
        <div className="min-w-0">
          <h4 className="text-white font-bold text-sm truncate max-w-[140px]">{apiKey.keyName}</h4>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono mt-0.5 block">{apiKey.providerCode}</span>
        </div>
        <span className="text-[10px] bg-purple-600/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded font-mono whitespace-nowrap">{list.length} Models</span>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />
            Scanning models list...
          </div>
        ) : list.length === 0 ? (
          <div className="text-zinc-600 text-xs text-center py-10">No models discovered or key is in a failing state.</div>
        ) : (
          list.map((item: any) => (
            <div key={item.id} className="p-2.5 bg-black/40 border border-zinc-900 hover:border-zinc-800 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="truncate flex-1">
                <span className="font-semibold text-zinc-200 block truncate leading-none" title={item.modelName}>{item.displayName}</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-1 block truncate">{item.modelName}</span>
              </div>
              <div className="text-right shrink-0">
                <ModelVerificationBadge status={item.verificationStatus} />
                {item.latencyMs > 0 && <span className="text-[9px] text-purple-400 font-mono font-bold block mt-1">{item.latencyMs}ms</span>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
