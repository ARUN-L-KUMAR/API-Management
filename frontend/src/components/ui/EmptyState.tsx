import React from 'react'
import { clsx } from 'clsx'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center', className)}>
      <div className="text-zinc-600 mb-4">
        {icon}
      </div>
      <h3 className="text-white font-bold text-sm">{title}</h3>
      {description && (
        <p className="text-zinc-500 text-xs mt-1 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
