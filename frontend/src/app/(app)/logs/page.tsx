'use client'

import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw, Activity, Search, Filter, X, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Download,
} from 'lucide-react'
import { api, type ActivityLog } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { clsx } from 'clsx'

type LogStatus = 'Success' | 'Failed' | 'all'
type LogEventType = string | 'all'
type DateRange = 'all' | 'today' | '7d' | '30d' | 'custom'

const EVENT_TYPES = ['all', 'Validation', 'Verification'] as const

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function isInDateRange(dateStr: string, range: DateRange, customStart?: string, customEnd?: string): boolean {
  if (range === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range) {
    case 'today':
      return date >= startOfDay
    case '7d':
      return date >= new Date(startOfDay.getTime() - 7 * 86400000)
    case '30d':
      return date >= new Date(startOfDay.getTime() - 30 * 86400000)
    case 'custom':
      if (customStart && date < new Date(customStart)) return false
      if (customEnd && date > new Date(customEnd + 'T23:59:59')) return false
      return true
    default:
      return true
  }
}

export default function LogsPage() {
  const queryClient = useQueryClient()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LogStatus>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<LogEventType>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Cascading filters
  const [providerFilter, setProviderFilter] = useState('')
  const [keyIdFilter, setKeyIdFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.getLogs(),
    refetchInterval: 15000,
  })

  const { data: allKeys = [] } = useQuery({
    queryKey: ['keys'],
    queryFn: () => api.getKeys(),
  })

  const providers = useMemo(() => {
    const codes = new Set(allKeys.map((k) => k.providerCode))
    return Array.from(codes).sort()
  }, [allKeys])

  const filteredByProvider = useMemo(() => {
    if (!providerFilter) return allKeys
    return allKeys.filter((k) => k.providerCode === providerFilter)
  }, [allKeys, providerFilter])

  const { data: keyModels = [] } = useQuery({
    queryKey: ['key-models', keyIdFilter],
    queryFn: () => api.getKeyModels(keyIdFilter!),
    enabled: !!keyIdFilter,
  })

  const filteredLogs = useMemo(() => {
    let result = [...logs] as ActivityLog[]

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }

    // Event type filter
    if (eventTypeFilter !== 'all') {
      result = result.filter((l) => l.eventType === eventTypeFilter)
    }

    // Date range filter
    result = result.filter((l) => isInDateRange(l.createdAt, dateRange, customStart, customEnd))

    // Provider filter
    if (providerFilter) {
      result = result.filter((l) => l.providerCode === providerFilter)
    }

    // Key filter
    if (keyIdFilter) {
      const selectedKey = allKeys.find((k) => k.id === keyIdFilter)
      if (selectedKey) {
        result = result.filter((l) => l.keyName === selectedKey.keyName)
      }
    }

    // Model filter (via message text)
    if (modelFilter) {
      result = result.filter((l) => l.message.toLowerCase().includes(modelFilter.toLowerCase()))
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.keyName.toLowerCase().includes(q) ||
          l.providerCode.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q) ||
          l.eventType.toLowerCase().includes(q)
      )
    }

    // Sort by most recent first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return result
  }, [logs, searchQuery, statusFilter, eventTypeFilter, dateRange, customStart, customEnd, providerFilter, keyIdFilter, modelFilter, allKeys])

  // Stats
  const stats = useMemo(() => {
    const total = filteredLogs.length
    const successCount = filteredLogs.filter((l) => l.status === 'Success').length
    const failedCount = total - successCount
    const durations = filteredLogs.map((l) => l.durationMs).filter((d) => d > 0)
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0
    return { total, successCount, failedCount, avgDuration, successRate }
  }, [filteredLogs])

  const paginatedLogs = filteredLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE)

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || eventTypeFilter !== 'all' || dateRange !== 'all' || !!providerFilter || !!keyIdFilter || !!modelFilter

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setEventTypeFilter('all')
    setDateRange('all')
    setCustomStart('')
    setCustomEnd('')
    setProviderFilter('')
    setKeyIdFilter('')
    setModelFilter('')
    setPage(0)
  }

  const exportFiltered = () => {
    const headers = ['Timestamp', 'Key Name', 'Provider', 'Event Type', 'Status', 'Message', 'Duration (ms)']
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.keyName,
      l.providerCode,
      l.eventType,
      l.status,
      l.message,
      l.durationMs?.toString() || '',
    ])
    const csv =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.setAttribute('href', encodeURI(csv))
    a.setAttribute('download', `logs-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="p-4 lg:p-6 border-b border-[#1f1f23] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Verification Logs</h2>
            <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
              Real-time background verification logs from scheduled monitor runs and validation triggers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'text-purple-400' : ''}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-[9px] font-bold">
                  {[searchQuery, statusFilter !== 'all', eventTypeFilter !== 'all', dateRange !== 'all', !!providerFilter, !!keyIdFilter, !!modelFilter].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={exportFiltered} title="Export filtered logs">
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['logs'] })}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Cascading provider → key → model filter */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setKeyIdFilter(''); setModelFilter(''); setPage(0) }}
            className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={keyIdFilter}
            onChange={(e) => { setKeyIdFilter(e.target.value); setModelFilter(''); setPage(0) }}
            className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
            disabled={!providerFilter}
          >
            <option value="">All Keys</option>
            {filteredByProvider.map((k) => (
              <option key={k.id} value={k.id}>{k.keyName}</option>
            ))}
          </select>

          <select
            value={modelFilter}
            onChange={(e) => { setModelFilter(e.target.value); setPage(0) }}
            className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500 min-w-[130px]"
            disabled={!keyIdFilter}
          >
            <option value="">All Models</option>
            {keyModels.map((m) => (
              <option key={m.id} value={m.modelName}>{m.displayName || m.modelName}</option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        {!isLoading && logs.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
            <span className="text-zinc-500">
              <strong className="text-white">{stats.total}</strong> total
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {stats.successCount}
            </span>
            <span className="text-red-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> {stats.failedCount}
            </span>
            <span className="text-zinc-500">
              Success rate: <strong className={stats.successRate >= 90 ? 'text-emerald-400' : stats.successRate >= 50 ? 'text-amber-400' : 'text-red-400'}>{stats.successRate}%</strong>
            </span>
            <span className="text-zinc-500">
              Avg duration:{' '}
              <strong className="text-purple-400">
                {stats.avgDuration > 0 ? formatDuration(Math.round(stats.avgDuration)) : '-'}
              </strong>
            </span>
            <span className="text-zinc-500">
              Auto-refresh: <span className="text-emerald-400 animate-pulse">●</span> 15s
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Filter panel */}
        {showFilters && (
          <div className="shrink-0 glass-panel border-b border-[#1f1f23] p-4 lg:p-6">
            <div className="flex flex-wrap items-end gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search key, provider, message..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 block">Status</label>
                <div className="flex gap-1">
                  {(['all', 'Success', 'Failed'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(0) }}
                      className={clsx(
                        'px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer',
                        statusFilter === s
                          ? s === 'all' ? 'bg-purple-600 text-white' : s === 'Success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      )}
                    >
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event type filter */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 block">Event Type</label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => { setEventTypeFilter(e.target.value); setPage(0) }}
                  className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 block">Date Range</label>
                <div className="flex gap-1">
                  {(['all', 'today', '7d', '30d'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setDateRange(r); setPage(0) }}
                      className={clsx(
                        'px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer',
                        dateRange === r ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      )}
                    >
                      {r === 'all' ? 'All Time' : r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
                    </button>
                  ))}
                </div>
                {dateRange === 'custom' && (
                  <div className="flex gap-2 mt-2">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                      className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-purple-500" />
                    <span className="text-zinc-500 text-xs self-center">to</span>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                      className="bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-purple-500" />
                  </div>
                )}
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer self-center pb-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium">
                    Search: &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    statusFilter === 'Success' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' : 'bg-red-600/10 border-red-500/20 text-red-400'
                  )}>
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {eventTypeFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium">
                    Type: {eventTypeFilter}
                    <button onClick={() => setEventTypeFilter('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {dateRange !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium">
                    Date: {dateRange === 'today' ? 'Today' : dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : dateRange}
                    <button onClick={() => setDateRange('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {providerFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                    Provider: {providerFilter}
                    <button onClick={() => { setProviderFilter(''); setKeyIdFilter(''); setModelFilter('') }} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {keyIdFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-medium">
                    Key: {allKeys.find((k) => k.id === keyIdFilter)?.keyName || keyIdFilter}
                    <button onClick={() => { setKeyIdFilter(''); setModelFilter('') }} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {modelFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                    Model: {modelFilter}
                    <button onClick={() => setModelFilter('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {isLoading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-12 h-12" />}
              title={logs.length === 0 ? 'No Activity Logs' : 'No matching logs'}
              description={logs.length === 0
                ? 'No activity logs registered. Run key validations to inspect output timelines.'
                : 'Try adjusting your filters to see more results.'}
              action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
            />
          ) : (
            <div className="space-y-2">
              {paginatedLogs.map((log) => {
                const isExpanded = expandedId === log.id
                return (
                  <div
                    key={log.id}
                    className={clsx(
                      'glass-panel rounded-xl border transition-all cursor-pointer',
                      isExpanded ? 'border-purple-500/30' : 'border-[#1f1f23] hover:border-zinc-700'
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-4 px-4 lg:px-5 py-3.5 text-xs">
                      {/* Status icon */}
                      <div className="shrink-0">
                        {log.status === 'Success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="shrink-0 w-24 lg:w-32">
                        <span className="text-zinc-300 font-medium" title={new Date(log.createdAt).toLocaleString()}>
                          {relativeTime(log.createdAt)}
                        </span>
                        <span className="text-zinc-600 text-[10px] block leading-none mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Key & Provider */}
                      <div className="min-w-0 flex-1">
                        <span className="text-white font-semibold truncate block leading-none">{log.keyName}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5 block">{log.providerCode}</span>
                      </div>

                      {/* Event type badge */}
                      <div className="shrink-0 hidden sm:block">
                        <span className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-semibold border',
                          log.eventType === 'Validation' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' :
                          log.eventType === 'Verification' ? 'bg-cyan-600/10 border-cyan-500/20 text-cyan-400' :
                          'bg-zinc-800 border-zinc-700 text-zinc-400'
                        )}>
                          {log.eventType}
                        </span>
                      </div>

                      {/* Message (truncated) */}
                      <div className="hidden lg:block min-w-0 flex-1 max-w-md">
                        <span className="text-zinc-400 truncate block">{log.message}</span>
                      </div>

                      {/* Duration */}
                      <div className="shrink-0 text-right">
                        <span className={clsx(
                          'font-mono font-bold',
                          log.durationMs > 0 && log.durationMs < 1000 ? 'text-emerald-400' :
                          log.durationMs >= 1000 && log.durationMs < 5000 ? 'text-amber-400' :
                          log.durationMs >= 5000 ? 'text-red-400' : 'text-zinc-500'
                        )}>
                          {formatDuration(log.durationMs)}
                        </span>
                      </div>

                      {/* Expand indicator */}
                      <div className="shrink-0 text-zinc-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-[#1f1f23] px-4 lg:px-5 py-4 space-y-3 text-xs bg-black/20 rounded-b-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Event Type</span>
                            <span className="text-white font-medium">{log.eventType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Status</span>
                            <span className={log.status === 'Success' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                              {log.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Duration</span>
                            <span className="text-purple-400 font-mono font-bold">{formatDuration(log.durationMs)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Timestamp</span>
                            <span className="text-zinc-300">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Full Message</span>
                          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 text-zinc-300 leading-relaxed whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                            {log.message || 'No additional details.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 text-xs text-zinc-500">
                  <span>
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredLogs.length)} of{' '}
                    <strong className="text-zinc-300">{filteredLogs.length}</strong> results
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      let pageNum: number
                      if (totalPages <= 7) {
                        pageNum = i
                      } else if (page < 3) {
                        pageNum = i
                      } else if (page > totalPages - 4) {
                        pageNum = totalPages - 7 + i
                      } else {
                        pageNum = page - 3 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={clsx(
                            'w-7 h-7 rounded text-xs font-medium cursor-pointer',
                            pageNum === page ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                          )}
                        >
                          {pageNum + 1}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
