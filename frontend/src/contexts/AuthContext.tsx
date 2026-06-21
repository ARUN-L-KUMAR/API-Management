'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, AuthResponse } from '@/lib/api'

interface User {
  id: string
  email: string
  name: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  user: User | null
  organization: Organization | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const storeAuth = useCallback((data: AuthResponse) => {
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('x-organization-id', data.organization.id)
    localStorage.setItem('x-user-id', data.user.id)
    setToken(data.token)
    setUser(data.user)
    setOrganization(data.organization)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('x-organization-id')
    localStorage.removeItem('x-user-id')
    setToken(null)
    setUser(null)
    setOrganization(null)
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setToken(storedToken)
    api.getMe()
      .then((data) => {
        setUser(data.user)
        setOrganization(data.organization)
        localStorage.setItem('x-organization-id', data.organization.id)
        localStorage.setItem('x-user-id', data.user.id)
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [clearAuth])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password)
    storeAuth(data)
  }, [storeAuth])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const data = await api.register(email, password, name)
    storeAuth(data)
  }, [storeAuth])

  const logout = useCallback(() => {
    clearAuth()
    router.push('/login')
  }, [clearAuth, router])

  return (
    <AuthContext.Provider value={{ user, organization, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
