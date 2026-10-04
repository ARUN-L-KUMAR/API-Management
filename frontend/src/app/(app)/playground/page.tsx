'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Play, RefreshCw, Terminal, CheckCircle, XCircle, 
  Copy, Check, Code, Sparkles, Sliders, Trash2, ArrowUpRight, 
  Download, Zap, ShieldCheck
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ProviderBadge } from '@/components/ui/StatusBadge'

const PRESETS = [
  { label: 'Health Ping', prompt: 'Reply only with "OK" to verify endpoint latency and connectivity.' },
  { label: 'JSON Extraction', prompt: 'Extract key entities from the following text and format as strict JSON:\n"Nexus AI operates 24/7 with 99.98% uptime across 12 worldwide clusters."' },
  { label: 'Code Generation', prompt: 'Write a TypeScript function to calculate exponential backoff with jitter for HTTP retries.' },
  { label: 'Reasoning Probe', prompt: 'Which is larger: 9.11 or 9.9? Explain your mathematical reasoning briefly.' },
]

function PlaygroundStudioContent() {
  const searchParams = useSearchParams()
  const keyIdParam = searchParams.get('keyId') || ''
  const modelParam = searchParams.get('model') || ''
  const modelIdParam = searchParams.get('modelId') || ''
  const promptParam = searchParams.get('prompt') || ''

  const [selectedPlaygroundKey, setSelectedPlaygroundKey] = useState('')
  const [selectedPlaygroundModel, setSelectedPlaygroundModel] = useState('')
  const [playgroundPrompt, setPlaygroundPrompt] = useState('Reply only with OK')
  const [playgroundResponse, setPlaygroundResponse] = useState<any | null>(null)
  const [providerFilter, setProviderFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'text' | 'json' | 'curl'>('text')
  const [isCopied, setIsCopied] = useState(false)

  // Parameters (UI sliders)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  // Synchronize key selection from URL query parameters
  useEffect(() => {
    if (keyIdParam && keys.length > 0) {
      const matchedKey = keys.find((k: any) => k.id === keyIdParam)
      if (matchedKey) {
        setSelectedPlaygroundKey(matchedKey.id)
        if (matchedKey.providerCode) {
          setProviderFilter(matchedKey.providerCode)
        }
      }
    }
  }, [keyIdParam, keys])

  const providers = useMemo(() => {
    const codes = new Set(keys.map((k: any) => k.providerCode))
    return Array.from(codes).sort()
  }, [keys])

  const workingKeys = useMemo(() => {
    let result = keys.filter((k: any) => k.status === 'Working' || k.id === selectedPlaygroundKey)
    if (providerFilter) {
      result = result.filter((k: any) => k.providerCode === providerFilter || k.id === selectedPlaygroundKey)
    }
    return result
  }, [keys, providerFilter, selectedPlaygroundKey])

  const { data: playgroundModels = [], isLoading: isLoadingPModels } = useQuery({
    queryKey: ['key-working-models', selectedPlaygroundKey],
    queryFn: () => api.getKeyModels(selectedPlaygroundKey, false, false),
    enabled: !!selectedPlaygroundKey,
  })

  // Synchronize model selection from URL query parameters once key models load
  useEffect(() => {
    if ((modelParam || modelIdParam) && playgroundModels.length > 0) {
      const targetName = (modelParam || '').trim().toLowerCase()
      const matched = playgroundModels.find((m: any) => 
        (modelIdParam && m.id === modelIdParam) ||
        (targetName && m.modelName?.toLowerCase() === targetName) ||
        (targetName && m.displayName?.toLowerCase() === targetName) ||
        (targetName && m.id?.toLowerCase() === targetName)
      )
      if (matched) {
        setSelectedPlaygroundModel(matched.id)
      }
    }
  }, [modelParam, modelIdParam, playgroundModels])

  // Synchronize prompt from URL if provided
  useEffect(() => {
    if (promptParam) {
      setPlaygroundPrompt(promptParam)
    }
  }, [promptParam])

  const workingPlaygroundModels = useMemo(() => {
    let result = playgroundModels.filter((m: any) => m.verificationStatus === 'Working')
    if (selectedPlaygroundModel && !result.some((m: any) => m.id === selectedPlaygroundModel)) {
      const selectedObj = playgroundModels.find((m: any) => m.id === selectedPlaygroundModel)
      if (selectedObj) {
        result = [selectedObj, ...result]
      }
    }
    return result
  }, [playgroundModels, selectedPlaygroundModel])

  const selectedKeyObj = keys.find((k: any) => k.id === selectedPlaygroundKey)
  const selectedModelObj = workingPlaygroundModels.find((m: any) => m.id === selectedPlaygroundModel)

  const runPlaygroundMutation = useMutation({
    mutationFn: (data: { keyId: string; modelId: string; prompt: string }) =>
      api.runPlayground(data.keyId, data.modelId, data.prompt),
    onSuccess: (data) => {
      setPlaygroundResponse(data)
      toast.success('Inference execution completed')
    },
    onError: (err: any) => {
      setPlaygroundResponse({ status: 'Failed', errorMessage: err.message, latencyMs: 0 })
      toast.error(err.message)
    },
  })

  const queryClient = useQueryClient()

  const syncAllMutation = useMutation({
    mutationFn: api.syncAllModels,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['key-working-models'] })
      queryClient.invalidateQueries({ queryKey: ['keys'] })
      queryClient.invalidateQueries({ queryKey: ['models'] })
      queryClient.invalidateQueries({ queryKey: ['key-models'] })
      toast.success(data.message || `Synced ${data.workingModels} working models across ${data.keysCount} keys!`)
    },
    onError: (err: any) => toast.error(err.message || 'Failed to sync models'),
  })

  const handleRunPlayground = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedPlaygroundKey || !selectedPlaygroundModel) {
      toast.error('Select an API key and model first')
      return
    }
    if (!playgroundPrompt.trim()) {
      toast.error('Please enter a prompt to evaluate')
      return
    }
    setPlaygroundResponse(null)
    runPlaygroundMutation.mutate({
      keyId: selectedPlaygroundKey,
      modelId: selectedPlaygroundModel,
      prompt: playgroundPrompt,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRunPlayground()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const generateCurl = () => {
    const modelName = selectedModelObj?.modelName || 'gpt-4o'
    return `curl -X POST https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${API_KEY}" \\
  -d '{
    "model": "${modelName}",
    "messages": [{"role": "user", "content": ${JSON.stringify(playgroundPrompt)}}],
    "temperature": ${temperature},
    "max_tokens": ${maxTokens}
  }'`
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Subheader */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/60 dark:bg-zinc-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Playground Studio</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400">
              Interactive Workbench
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Execute real-time test queries across any vaulted provider key with live latency diagnostics.
          </p>
        </div>

        {/* Status & Sync All Button */}
        <div className="flex items-center gap-3">
          {selectedKeyObj && (
            <div className="hidden sm:flex items-center gap-2">
              <ProviderBadge provider={selectedKeyObj.providerCode} />
              <span className="text-xs font-mono text-muted-foreground">
                {selectedKeyObj.keyName}
              </span>
            </div>
          )}
          <button
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
            title="Scan and verify all models across all active API keys live"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncAllMutation.isPending ? 'Syncing Active Models...' : 'Sync & Verify All Models'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio View - Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Configuration & Prompt Controls */}
        <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-card/60 dark:bg-zinc-950/20 p-4 lg:p-6 flex flex-col justify-between overflow-y-auto shrink-0 space-y-6">
          <div className="space-y-5">
            {/* Target Endpoint Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                Target Endpoint & Credentials
              </label>

              {/* Provider Filter */}
              <select
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value)
                  setSelectedPlaygroundKey('')
                  setSelectedPlaygroundModel('')
                }}
                className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground p-2.5 focus:outline-none focus:border-purple-500"
              >
                <option value="">Filter by Provider (All)</option>
                {providers.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>

              {/* Key Selector */}
              <select
                value={selectedPlaygroundKey}
                onChange={(e) => {
                  setSelectedPlaygroundKey(e.target.value)
                  setSelectedPlaygroundModel('')
                }}
                className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground p-2.5 focus:outline-none focus:border-purple-500"
              >
                <option value="">1. Select Vaulted API Key...</option>
                {workingKeys.map((key: any) => (
                  <option key={key.id} value={key.id}>
                    {key.keyName} ({key.providerCode.toUpperCase()})
                  </option>
                ))}
              </select>

              {/* Model Selector */}
              <select
                value={selectedPlaygroundModel}
                onChange={(e) => setSelectedPlaygroundModel(e.target.value)}
                disabled={!selectedPlaygroundKey || isLoadingPModels}
                className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg text-xs text-foreground p-2.5 focus:outline-none focus:border-purple-500 disabled:opacity-40"
              >
                <option value="">
                  {isLoadingPModels
                    ? 'Scanning working models...'
                    : !selectedPlaygroundKey
                    ? '2. Select Model to Test...'
                    : workingPlaygroundModels.length === 0
                    ? 'No verified working models found for this key'
                    : '2. Select a Working Model...'}
                </option>
                {workingPlaygroundModels.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName || item.modelName}{item.latencyMs > 0 ? ` (${item.latencyMs}ms)` : ''}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-muted-foreground">
                  {selectedPlaygroundKey ? `${workingPlaygroundModels.length} active models ready` : 'Select a key to view models'}
                </span>
                <button
                  type="button"
                  onClick={() => syncAllMutation.mutate()}
                  disabled={syncAllMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title="Run live probe across all provider keys"
                >
                  <RefreshCw className={`w-3 h-3 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{syncAllMutation.isPending ? 'Syncing...' : 'Sync Live Models'}</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPlaygroundPrompt(preset.prompt)}
                    className="p-2 text-left bg-muted/60 hover:bg-muted border border-border rounded-lg text-[11px] text-foreground transition-all cursor-pointer truncate"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hyperparameters */}
            <div className="space-y-3 pt-3 border-t border-[#1e1e24]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                  Parameters
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Inference config</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Temperature</span>
                  <span className="font-mono text-purple-400 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Max Tokens</span>
                  <span className="font-mono text-purple-400 font-bold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="128"
                  max="4096"
                  step="128"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e1e24] text-[10px] text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 Encrypted Handshake</span>
            </div>
            <p>Direct provider proxy with zero prompt retention on edge nodes.</p>
          </div>
        </div>

        {/* Right Column: Console & Response Output */}
        <div className="flex-1 flex flex-col min-h-0 bg-background p-4 lg:p-6 gap-4">
          {/* Console Header Bar */}
          <div className="glass-panel rounded-2xl border border-border flex-1 flex flex-col overflow-hidden shadow-2xl min-h-0">
            {/* Console Toolbar */}
            <div className="px-5 py-3 border-b border-border bg-card/80 dark:bg-zinc-950/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-foreground ml-1">
                  AI Console Stream
                </span>

                {/* View Tabs */}
                <div className="hidden sm:flex items-center gap-1 ml-4 p-0.5 rounded-lg bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800">
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'text' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Formatted Output
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'json' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Raw Payload
                  </button>
                  <button
                    onClick={() => setActiveTab('curl')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'curl' ? 'bg-card dark:bg-zinc-800 text-foreground dark:text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    cURL Spec
                  </button>
                </div>
              </div>

              {/* Response Stats */}
              <div className="flex items-center gap-3">
                {playgroundResponse && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-muted-foreground">
                      Latency:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {playgroundResponse.latencyMs || 0}ms
                      </strong>
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          activeTab === 'curl'
                            ? generateCurl()
                            : playgroundResponse.response || playgroundResponse.errorMessage || ''
                        )
                      }
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                      title="Copy Output"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setPlaygroundResponse(null)}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Clear Output"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Output Stream Body */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-foreground">
              {!playgroundResponse && !runPlaygroundMutation.isPending && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <Terminal className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground text-sm">Console Standby</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Choose an API key and model, type your prompt below, and press Run Prompt (⌘Enter).
                    </p>
                  </div>
                </div>
              )}

              {runPlaygroundMutation.isPending && (
                <div className="space-y-3 text-muted-foreground py-6">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Establishing authenticated handshake with provider endpoint...</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 dark:bg-zinc-950/80 border border-border text-muted-foreground space-y-1">
                    <p>&gt; POST /v1/chat/completions HTTP/1.1</p>
                    <p>&gt; Host: {selectedKeyObj?.providerCode || 'api.provider'}.com</p>
                    <p>&gt; Model: {selectedModelObj?.modelName || 'selected-model'}</p>
                    <p>&gt; Stream: Awaiting response payload chunk...</p>
                  </div>
                </div>
              )}

              {playgroundResponse && (
                <div className="space-y-4">
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground uppercase text-[10px] font-bold">Execution Status:</span>
                      {playgroundResponse.status === 'Working' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> 200 OK • Working
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Error • {playgroundResponse.status}
                        </span>
                      )}
                    </div>
                    {playgroundResponse.latencyMs > 0 && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                        Roundtrip: {playgroundResponse.latencyMs}ms
                      </span>
                    )}
                  </div>

                  {/* Tab views */}
                  {activeTab === 'text' && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        Response Body:
                      </span>
                      <pre className="bg-muted/40 dark:bg-zinc-950/90 p-5 rounded-xl border border-border whitespace-pre-wrap leading-relaxed text-foreground overflow-x-auto selection:bg-purple-600/20">
                        {playgroundResponse.response || playgroundResponse.errorMessage || 'No response content returned.'}
                      </pre>
                    </div>
                  )}

                  {activeTab === 'json' && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        Raw Response Object:
                      </span>
                      <pre className="bg-muted/40 dark:bg-zinc-950/90 p-5 rounded-xl border border-border whitespace-pre-wrap leading-relaxed text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                        {JSON.stringify(playgroundResponse, null, 2)}
                      </pre>
                    </div>
                  )}

                  {activeTab === 'curl' && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        Executable cURL Command:
                      </span>
                      <pre className="bg-muted/40 dark:bg-zinc-950/90 p-5 rounded-xl border border-border whitespace-pre-wrap leading-relaxed text-amber-700 dark:text-amber-300 overflow-x-auto">
                        {generateCurl()}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleRunPlayground} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shrink-0">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  User Prompt
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Press ⌘ + Enter to execute
                </span>
              </div>
              <textarea
                rows={2}
                value={playgroundPrompt}
                onChange={(e) => setPlaygroundPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter prompt instruction here..."
                className="w-full bg-card dark:bg-zinc-900/90 border border-border dark:border-zinc-800 rounded-xl text-xs text-foreground p-3.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 placeholder-muted-foreground resize-none font-sans"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="px-8 py-3.5 h-12 shadow-lg shadow-purple-900/25 shrink-0"
              loading={runPlaygroundMutation.isPending}
              disabled={!selectedPlaygroundKey || !selectedPlaygroundModel}
            >
              {runPlaygroundMutation.isPending ? (
                <>Evaluating...</>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Run Prompt
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
          Loading Playground Studio...
        </div>
      }
    >
      <PlaygroundStudioContent />
    </Suspense>
  )
}
