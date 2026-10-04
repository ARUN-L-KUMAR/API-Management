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
    <div className={clsx('glass-panel p-12 rounded-2xl border border-border flex flex-col items-center justify-center text-center', className)}>
      <div className="text-muted-foreground/80 mb-4">
        {icon}
      </div>
      <h3 className="text-foreground font-bold text-sm">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-xs mt-1 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
