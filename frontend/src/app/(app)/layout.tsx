'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <div className="text-muted-foreground text-xs font-mono tracking-wider uppercase">Initializing Vault...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-grid-pattern relative min-w-0">
        <Topbar />
        <main className="flex-1 flex flex-col overflow-hidden relative z-10 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
