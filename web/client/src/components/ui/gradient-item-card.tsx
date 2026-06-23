'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, LockKeyhole, Package, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ItemCardGradient = 'orange' | 'gray' | 'purple' | 'green'

export interface GradientItemCardProps {
  className?: string
  name: string
  spec?: string
  typeLabel: string
  quantity: number
  authRequired?: boolean
  accent: string
  badgeText: string
  onSelect?: () => void
  disabled?: boolean
  ctaText?: string
  gradient?: ItemCardGradient
}

const stockClassName = (quantity: number) => {
  if (quantity <= 0) return 'bg-red-50 text-red-700 ring-red-100'
  if (quantity <= 2) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}

const GradientItemCard = React.forwardRef<HTMLDivElement, GradientItemCardProps>(
  (
    {
      className,
      name,
      spec,
      typeLabel,
      quantity,
      authRequired,
      accent,
      badgeText,
      onSelect,
      disabled = false,
      ctaText = '选择领用',
    },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={disabled ? undefined : { y: -2 }}
        className={cn('h-full', disabled && 'opacity-55')}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className={cn(
            'group relative flex h-full w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-slate-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            className,
          )}
        >
          <div className="w-1.5 shrink-0" style={{ backgroundColor: accent }} />
          <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{badgeText}</span>
                  {authRequired && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      <ShieldCheck className="size-3.5" />
                      需授权
                    </span>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
              </div>
              <div className="rounded-md bg-slate-100 p-2 text-slate-500">
                <Package className="size-5" />
              </div>
            </div>

            <p className="mt-3 line-clamp-1 min-h-5 text-sm text-slate-500">{spec || '暂无规格信息'}</p>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-200 pt-3">
              <div className={cn('rounded-md px-3 py-2 ring-1', stockClassName(quantity))}>
                <div className="text-xs font-bold opacity-80">库存</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums">{quantity}</span>
                  <span className="text-xs font-bold">件</span>
                </div>
              </div>

              {quantity <= 0 ? (
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-400">暂无库存</span>
              ) : (
                <span className="inline-flex h-11 items-center gap-1.5 rounded-md bg-slate-950 px-3.5 text-sm font-bold text-white transition-colors group-hover:bg-teal-700">
                  {ctaText}
                  {authRequired ? <LockKeyhole className="size-4" /> : <ArrowRight className="size-4" />}
                </span>
              )}
            </div>

            <span className="sr-only">{typeLabel}</span>
          </div>
        </button>
      </motion.div>
    )
  },
)
GradientItemCard.displayName = 'GradientItemCard'

export { GradientItemCard }
