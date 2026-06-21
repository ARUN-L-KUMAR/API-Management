'use client'

import { AlertTriangle } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center h-screen">
      <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center max-w-md">
        <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-white font-bold text-sm">Something went wrong</h3>
        <p className="text-zinc-500 text-xs mt-1">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
