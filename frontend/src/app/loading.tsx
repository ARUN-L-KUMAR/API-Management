import { MetricSkeleton } from '@/components/ui/Skeleton'

export default function RootLoading() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-6 border-b border-[#1f1f23] shrink-0">
        <div className="h-6 w-64 animate-pulse bg-zinc-800/60 rounded" />
        <div className="h-3 w-48 animate-pulse bg-zinc-800/60 rounded mt-2" />
      </header>
      <div className="p-6 space-y-6 overflow-y-auto">
        <MetricSkeleton />
        <div className="glass-panel rounded-xl border border-[#1f1f23] p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-zinc-500 text-xs font-semibold">Loading dashboard...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
