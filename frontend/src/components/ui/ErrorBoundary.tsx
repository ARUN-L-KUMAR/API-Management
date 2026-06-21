'use client'

import React from 'react'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-white font-bold text-sm">Something went wrong</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
