import { CardsSkeleton } from '@/components/ui/Skeleton'

export default function ModelsLoading() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="p-6 border-b border-[#1f1f23] shrink-0">
        <div className="h-6 w-64 animate-pulse bg-zinc-800/60 rounded" />
        <div className="h-3 w-48 animate-pulse bg-zinc-800/60 rounded mt-2" />
      </header>
      <div className="p-6 space-y-4 overflow-y-auto">
        <div className="glass-panel p-4 rounded-xl">
          <div className="h-4 w-32 animate-pulse bg-zinc-800/60 rounded mb-2" />
          <div className="h-8 w-64 animate-pulse bg-zinc-800/60 rounded" />
        </div>
        <CardsSkeleton count={6} />
      </div>
    </div>
  )
}
