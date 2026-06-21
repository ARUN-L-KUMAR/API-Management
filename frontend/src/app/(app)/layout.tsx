'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

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
      <div className="flex h-screen w-full items-center justify-center bg-[#030303]">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      {children}
    </div>
  )
}
