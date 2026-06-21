'use client'

import React, { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Play, RefreshCw, Terminal, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'


export default function PlaygroundPage() {
  const [selectedPlaygroundKey, setSelectedPlaygroundKey] = useState('')
  const [selectedPlaygroundModel, setSelectedPlaygroundModel] = useState('')
  const [playgroundPrompt, setPlaygroundPrompt] = useState('Reply only with OK')
  const [playgroundResponse, setPlaygroundResponse] = useState<any | null>(null)
  const [providerFilter, setProviderFilter] = useState('')

  const { data: keys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  const providers = useMemo(() => {
    const codes = new Set(keys.map((k: any) => k.providerCode))
    return Array.from(codes).sort()
  }, [keys])

  const workingKeys = useMemo(() => {
    let result = keys.filter((k: any) => k.status === 'Working')
    if (providerFilter) result = result.filter((k: any) => k.providerCode === providerFilter)
    return result
  }, [keys, providerFilter])

  const { data: playgroundModels = [], isLoading: isLoadingPModels } = useQuery({
    queryKey: ['key-models', selectedPlaygroundKey],
    queryFn: () => api.getKeyModels(selectedPlaygroundKey, true, true),
    enabled: !!selectedPlaygroundKey,
  })

  const runPlaygroundMutation = useMutation({
    mutationFn: (data: { keyId: string; modelId: string; prompt: string }) =>
      api.runPlayground(data.keyId, data.modelId, data.prompt),
    onSuccess: (data) => {
      setPlaygroundResponse(data)
      toast.success('Execution completed')
    },
    onError: (err: any) => {
      setPlaygroundResponse({ status: 'Failed', errorMessage: err.message })
      toast.error(err.message)
    },
  })

  const handleRunPlayground = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlaygroundKey || !selectedPlaygroundModel) {
      toast.error('Select an API key and model first')
      return
    }
    setPlaygroundResponse(null)
    runPlaygroundMutation.mutate({
      keyId: selectedPlaygroundKey,
      modelId: selectedPlaygroundModel,
      prompt: playgroundPrompt,
    })
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-4 lg:p-6 border-b border-[#1f1f23] shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Playground Console</h2>
            <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">Test prompts against discovered models in real-time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); setSelectedPlaygroundKey(''); setSelectedPlaygroundModel('') }}
              className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
            >
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={selectedPlaygroundKey}
              onChange={(e) => { setSelectedPlaygroundKey(e.target.value); setSelectedPlaygroundModel('') }}
              className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
            >
              <option value="">Select a Working Key</option>
              {workingKeys.map((key: any) => (
                <option key={key.id} value={key.id}>{key.keyName} ({key.providerCode})</option>
              ))}
            </select>

            <select
              value={selectedPlaygroundModel}
              onChange={(e) => setSelectedPlaygroundModel(e.target.value)}
              disabled={!selectedPlaygroundKey || isLoadingPModels}
              className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px] disabled:opacity-40"
            >
              <option value="">
                {isLoadingPModels ? 'Loading key models...' : 'Select a Model'}
              </option>
              {playgroundModels.map((item: any) => (
                <option key={item.id} value={item.id}>{item.displayName} ({item.verificationStatus})</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">
        {/* Console Output - full width */}
        <div className="flex-1 glass-panel rounded-2xl border border-[#1f1f23] overflow-hidden flex flex-col bg-black/60 min-h-0">
          <div className="px-5 py-3.5 border-b border-[#1f1f23] flex items-center justify-between bg-zinc-950/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-[10px] font-mono text-zinc-500 ml-2">Console Output</span>
            </div>
            {playgroundResponse && (
              <span className="text-[10px] font-mono text-zinc-500">
                Latency: <strong className="text-purple-400">{playgroundResponse.latencyMs || 0}ms</strong>
              </span>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-zinc-300 space-y-4">
            {!playgroundResponse && !runPlaygroundMutation.isPending && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Terminal className="w-8 h-8 mb-2" />
                <span>Console idle. Submit a query to inspect live JSON payload returns.</span>
              </div>
            )}

            {runPlaygroundMutation.isPending && (
              <div className="space-y-2 text-zinc-500">
                <span className="animate-pulse flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Establishing handshake to target provider endpoint...
                </span>
                <span>POST Request payload sent. Awaiting completion response...</span>
              </div>
            )}

            {playgroundResponse && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">Response Status</span>
                  {playgroundResponse.status === 'Working' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Working
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> {playgroundResponse.status}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="text-zinc-500">Output Stream:</span>
                  <pre className="bg-zinc-950 p-4 rounded-lg border border-zinc-900 whitespace-pre-wrap leading-relaxed text-zinc-100 overflow-x-auto">
                    {playgroundResponse.response || playgroundResponse.errorMessage || 'No content returned.'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prompt & Run - bottom center */}
        <form onSubmit={handleRunPlayground} className="flex items-center gap-3 shrink-0 w-full">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Test Prompt</label>
            <textarea
              rows={2}
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Type your prompt here..."
              className="w-full bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white p-3 focus:outline-none focus:border-purple-500 placeholder-zinc-600 resize-none"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="px-12 py-3 text-base"
            loading={runPlaygroundMutation.isPending}
            disabled={!selectedPlaygroundKey || !selectedPlaygroundModel}
          >
            {runPlaygroundMutation.isPending ? (
              <>Querying API...</>
            ) : (
              <><Play className="w-4 h-4" /> Run Prompt</>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
