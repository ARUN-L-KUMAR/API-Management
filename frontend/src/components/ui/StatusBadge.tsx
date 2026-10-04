import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, Clock, Shield, Sparkles } from 'lucide-react'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Working':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25 shadow-xs glow-pulse-working">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
          </span>
          Working
        </span>
      )
    case 'Quota Exceeded':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25 shadow-xs">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Quota Over
        </span>
      )
    case 'Invalid':
    case 'Unauthorized':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25 glow-pulse-failed shadow-xs">
          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" /> Invalid
        </span>
      )
    case 'Error':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25 glow-pulse-failed shadow-xs">
          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" /> Error
        </span>
      )
    case 'Rate Limited':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/25 shadow-xs">
          <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Limited
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
          <Shield className="w-3.5 h-3.5" /> {status}
        </span>
      )
  }
}

export function ModelVerificationBadge({ status }: { status: string }) {
  switch (status) {
    case 'Working':
      return (
        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/25 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          WORKING
        </span>
      )
    case 'Failed':
    case 'Unauthorized':
      return (
        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/25 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
          FAILED
        </span>
      )
    case 'Deprecated':
      return (
        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 dark:text-zinc-500 dark:bg-zinc-800/80 dark:border-zinc-700/60 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-600" />
          DEPRECATED
        </span>
      )
    default:
      return (
        <span className="text-muted-foreground font-bold bg-muted border border-border px-2 py-0.5 rounded text-[9px] font-mono tracking-wider">
          {status.toUpperCase()}
        </span>
      )
  }
}

export function ProviderBadge({ provider }: { provider: string }) {
  const p = (provider || '').toLowerCase()

  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    openai: { 
      label: 'OpenAI', 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      text: 'text-emerald-700 dark:text-emerald-400', 
      border: 'border-emerald-200 dark:border-emerald-500/30' 
    },
    anthropic: { 
      label: 'Anthropic', 
      bg: 'bg-amber-50 dark:bg-amber-500/10', 
      text: 'text-amber-800 dark:text-amber-400', 
      border: 'border-amber-200 dark:border-amber-500/30' 
    },
    gemini: { 
      label: 'Gemini', 
      bg: 'bg-blue-50 dark:bg-blue-500/10', 
      text: 'text-blue-700 dark:text-blue-400', 
      border: 'border-blue-200 dark:border-blue-500/30' 
    },
    groq: { 
      label: 'Groq', 
      bg: 'bg-orange-50 dark:bg-orange-500/10', 
      text: 'text-orange-700 dark:text-orange-400', 
      border: 'border-orange-200 dark:border-orange-500/30' 
    },
    deepseek: { 
      label: 'DeepSeek', 
      bg: 'bg-indigo-50 dark:bg-indigo-500/10', 
      text: 'text-indigo-700 dark:text-indigo-400', 
      border: 'border-indigo-200 dark:border-indigo-500/30' 
    },
    together: { 
      label: 'Together AI', 
      bg: 'bg-purple-50 dark:bg-purple-500/10', 
      text: 'text-purple-700 dark:text-purple-400', 
      border: 'border-purple-200 dark:border-purple-500/30' 
    },
    openrouter: { 
      label: 'OpenRouter', 
      bg: 'bg-cyan-50 dark:bg-cyan-500/10', 
      text: 'text-cyan-700 dark:text-cyan-400', 
      border: 'border-cyan-200 dark:border-cyan-500/30' 
    },
    elevenlabs: { 
      label: 'ElevenLabs', 
      bg: 'bg-pink-50 dark:bg-pink-500/10', 
      text: 'text-pink-700 dark:text-pink-400', 
      border: 'border-pink-200 dark:border-pink-500/30' 
    },
    cloudinary: { 
      label: 'Cloudinary', 
      bg: 'bg-sky-50 dark:bg-sky-500/10', 
      text: 'text-sky-700 dark:text-sky-400', 
      border: 'border-sky-200 dark:border-sky-500/30' 
    },
    aws: { 
      label: 'AWS', 
      bg: 'bg-amber-50 dark:bg-amber-500/10', 
      text: 'text-amber-800 dark:text-amber-400', 
      border: 'border-amber-200 dark:border-amber-500/30' 
    },
    redis: { 
      label: 'Redis', 
      bg: 'bg-rose-50 dark:bg-rose-500/10', 
      text: 'text-rose-700 dark:text-rose-400', 
      border: 'border-rose-200 dark:border-rose-500/30' 
    },
    upstash: { 
      label: 'Upstash', 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      text: 'text-emerald-700 dark:text-emerald-400', 
      border: 'border-emerald-200 dark:border-emerald-500/30' 
    },
    googlecloud: { 
      label: 'Google Cloud', 
      bg: 'bg-blue-50 dark:bg-blue-500/10', 
      text: 'text-blue-700 dark:text-blue-400', 
      border: 'border-blue-200 dark:border-blue-500/30' 
    },
    googleconsole: { 
      label: 'Google Console', 
      bg: 'bg-blue-50 dark:bg-blue-500/10', 
      text: 'text-blue-700 dark:text-blue-400', 
      border: 'border-blue-200 dark:border-blue-500/30' 
    },
    telegram: { 
      label: 'Telegram Bot', 
      bg: 'bg-sky-50 dark:bg-sky-400/10', 
      text: 'text-sky-700 dark:text-sky-300', 
      border: 'border-sky-200 dark:border-sky-400/30' 
    },
    github: { 
      label: 'GitHub', 
      bg: 'bg-slate-100 dark:bg-zinc-700/20', 
      text: 'text-slate-800 dark:text-zinc-300', 
      border: 'border-slate-300 dark:border-zinc-600/40' 
    },
    stripe: { 
      label: 'Stripe', 
      bg: 'bg-violet-50 dark:bg-violet-500/10', 
      text: 'text-violet-700 dark:text-violet-400', 
      border: 'border-violet-200 dark:border-violet-500/30' 
    },
    cloudflare: { 
      label: 'Cloudflare', 
      bg: 'bg-orange-50 dark:bg-orange-500/10', 
      text: 'text-orange-700 dark:text-orange-400', 
      border: 'border-orange-200 dark:border-orange-500/30' 
    },
    doubleworld: { 
      label: 'DoubleWorld', 
      bg: 'bg-teal-50 dark:bg-teal-500/10', 
      text: 'text-teal-700 dark:text-teal-400', 
      border: 'border-teal-200 dark:border-teal-500/30' 
    },
    opencode: { 
      label: 'OpenCode', 
      bg: 'bg-lime-50 dark:bg-lime-500/10', 
      text: 'text-lime-800 dark:text-lime-400', 
      border: 'border-lime-200 dark:border-lime-500/30' 
    },
    other: { 
      label: 'Custom / Other', 
      bg: 'bg-slate-100 dark:bg-zinc-800/80', 
      text: 'text-slate-700 dark:text-zinc-400', 
      border: 'border-slate-200 dark:border-zinc-700/60' 
    },
  }

  const match = config[p] || {
    label: provider.toUpperCase(),
    bg: 'bg-muted dark:bg-zinc-800/60',
    text: 'text-muted-foreground dark:text-zinc-300',
    border: 'border-border dark:border-zinc-700/60',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border ${match.bg} ${match.text} ${match.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {match.label}
    </span>
  )
}
