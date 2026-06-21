'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Eye, EyeOff } from 'lucide-react'
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
    <div className="flex-1 flex items-center justify-center min-h-screen p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-[#1f1f23] overflow-hidden shadow-2xl">
        <div className="p-8 pb-6 flex flex-col items-center border-b border-[#1f1f23]">
          <div className="p-3 bg-purple-600/10 border border-purple-500/30 rounded-xl text-purple-400 mb-4">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">AI Registry</h1>
          <p className="text-xs text-zinc-500 mt-1">Model Discovery Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {isRegister && (
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
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
                placeholder={isRegister ? 'Create a strong password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-[#1f1f23] rounded-lg text-xs text-white px-3 py-2.5 pr-10 focus:outline-none focus:border-purple-500 placeholder-zinc-600"
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

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
