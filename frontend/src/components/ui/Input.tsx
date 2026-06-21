import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-[10px] uppercase font-bold text-zinc-400 block">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'w-full bg-zinc-900 border rounded-lg text-xs text-white px-3 py-2.5 focus:outline-none focus:border-purple-500 placeholder-zinc-600 transition-colors',
          error ? 'border-red-500' : 'border-[#1f1f23]',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-[10px] uppercase font-bold text-zinc-400 block">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'w-full bg-zinc-900 border rounded-lg text-xs text-white px-3 py-2.5 focus:outline-none focus:border-purple-500 transition-colors',
          error ? 'border-red-500' : 'border-[#1f1f23]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}
