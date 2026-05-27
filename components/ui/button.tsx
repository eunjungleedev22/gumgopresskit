'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          {
            primary: 'bg-zinc-50 text-zinc-950 hover:bg-zinc-200',
            secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
            ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
            danger: 'bg-red-950/60 text-red-400 hover:bg-red-900/60',
            outline: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
          }[variant],
          {
            sm: 'text-xs px-2.5 py-1.5',
            md: 'text-sm px-3.5 py-2',
            lg: 'text-sm px-5 py-2.5',
          }[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
