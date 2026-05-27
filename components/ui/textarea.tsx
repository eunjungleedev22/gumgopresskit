'use client'

import { cn } from '@/lib/utils'
import { type TextareaHTMLAttributes, forwardRef } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-zinc-400">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2',
            'placeholder:text-zinc-600 resize-none',
            'focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-red-800',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export { Textarea }
