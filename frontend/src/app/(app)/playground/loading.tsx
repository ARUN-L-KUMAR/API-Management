import { Skeleton } from '@/components/ui/Skeleton'

export default function PlaygroundLoading() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-6 border-b border-[#1f1f23] shrink-0">
        <div className="h-6 w-64 animate-pulse bg-zinc-800/60 rounded" />
        <div className="h-3 w-48 animate-pulse bg-zinc-800/60 rounded mt-2" />
      </header>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl border border-[#1f1f23] p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="col-span-2 glass-panel rounded-2xl border border-[#1f1f23]">
            <Skeleton className="h-12 w-full rounded-t-2xl" />
            <div className="p-5">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
