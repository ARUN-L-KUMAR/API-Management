'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Database, Eye, EyeOff, ShieldCheck, Zap, 
  Sparkles, Activity, Key, Lock, ArrowRight 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password, name || undefined)
      } else {
        await login(email, password)
      }
      router.push('/keys')
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 bg-background text-foreground relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl border border-[#1e1e24] bg-zinc-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Enterprise Feature Showcase */}
        <div className="p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1e1e24] bg-gradient-to-b from-purple-950/20 via-zinc-950/40 to-transparent">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg text-white tracking-tight">NEXUS AI</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400">
                    ENTERPRISE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">Universal Model Registry & Telemetry</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                Unified AI Credentials & Model Discovery
              </h2>
              <p className="text-xs lg:text-sm text-zinc-400 leading-relaxed">
                Vault, monitor, and benchmark OpenAI, Google Gemini, Anthropic, Groq, and DeepSeek endpoints with microsecond telemetry.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AES-256 Authenticated Vault</h4>
                  <p className="text-[11px] text-zinc-400">Zero plaintext storage at rest with hardware cryptographic isolation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Continuous Heartbeat Probes</h4>
                  <p className="text-[11px] text-zinc-400">Automated background health checks detect expired keys & quota limits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dynamic Model Discovery</h4>
                  <p className="text-[11px] text-zinc-400">Instant model introspection across all multi-cloud AI endpoints.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1e1e24]/70 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>SOC2 Type II Ready</span>
            <span>TLS 1.3 Strict</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {isRegister ? 'Create Enterprise Account' : 'Sign in to Console'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {isRegister
                ? 'Register an organization workspace to start vaulting keys.'
                : 'Enter your credentials to access the discovery dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="admin@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isRegister ? 'Minimum 8 characters' : 'Enter account password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-[#1e1e24] rounded-lg text-xs text-white px-3.5 py-2.5 pr-10 focus:outline-none focus:border-purple-500 placeholder-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-sm shadow-lg shadow-purple-900/30 mt-2" loading={loading}>
              <span>{isRegister ? 'Complete Registration' : 'Authenticate & Enter'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer"
              >
                {isRegister ? 'Already registered? Sign in' : "Don't have an account? Create workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
