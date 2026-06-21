import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={clsx(
        'glass-panel rounded-xl border border-[#1f1f23]',
        hover && 'transition-all hover:border-purple-500/30 hover:translate-y-[-2px]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-5 py-4 border-b border-[#1f1f23] flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('p-5', className)}>
      {children}
    </div>
  )
}
