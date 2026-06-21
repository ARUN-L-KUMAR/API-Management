import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, Clock, Shield } from 'lucide-react'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Working':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 glow-pulse-working">
          <CheckCircle className="w-3.5 h-3.5" /> Working
        </span>
      )
    case 'Quota Exceeded':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" /> Quota Over
        </span>
      )
    case 'Invalid':
    case 'Unauthorized':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 glow-pulse-failed">
          <XCircle className="w-3.5 h-3.5" /> Invalid
        </span>
      )
    case 'Rate Limited':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Clock className="w-3.5 h-3.5" /> Limited
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
          <Shield className="w-3.5 h-3.5" /> {status}
        </span>
      )
  }
}

export function ModelVerificationBadge({ status }: { status: string }) {
  switch (status) {
    case 'Working':
      return <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px]">WORKING</span>
    case 'Failed':
    case 'Unauthorized':
      return <span className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[9px]">FAILED</span>
    case 'Deprecated':
      return <span className="text-zinc-500 font-bold bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[9px]">DEPRECATED</span>
    default:
      return <span className="text-zinc-400 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[9px]">{status.toUpperCase()}</span>
  }
}
