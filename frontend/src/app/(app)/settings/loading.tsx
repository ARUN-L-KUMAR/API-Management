import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-6 border-b border-[#1f1f23] shrink-0">
        <div className="h-6 w-48 animate-pulse bg-zinc-800/60 rounded" />
        <div className="h-3 w-64 animate-pulse bg-zinc-800/60 rounded mt-2" />
      </header>
      <div className="p-6 space-y-6 max-w-3xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel rounded-xl border border-[#1f1f23]">
            <div className="p-5 border-b border-[#1f1f23]">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56 mt-1" />
            </div>
            <div className="p-5">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
