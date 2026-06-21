'use client'

import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-purple-600 hover:bg-purple-500 text-white shadow-md': variant === 'primary',
          'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700': variant === 'secondary',
          'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200': variant === 'ghost',
          'bg-red-600 hover:bg-red-500 text-white': variant === 'danger',
        },
        {
          'text-[10px] px-2 py-1': size === 'sm',
          'text-xs px-3.5 py-1.5': size === 'md',
          'text-sm px-5 py-2.5': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
