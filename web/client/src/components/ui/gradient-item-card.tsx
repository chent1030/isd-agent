'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, LockKeyhole, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDisplayInitial } from '@/lib/shared'

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

const stockTone = (quantity: number) => {
  if (quantity <= 0) return 'border-red-200 bg-red-50 text-red-700'
  if (quantity <= 2) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
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
    const initial = getDisplayInitial(name)

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={disabled ? undefined : { y: -2 }}
        className={cn('h-full', disabled && 'opacity-55')}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className={cn(
            'group flex h-full min-h-[238px] w-full flex-col justify-between rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:border-slate-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md text-xl font-black text-white" style={{ backgroundColor: accent }}>
                {initial}
              </div>
              <div className="min-w-0">
                <div className="mb-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {badgeText}
                </div>
                <h3 className="line-clamp-2 text-xl font-bold leading-tight text-slate-950">{name}</h3>
              </div>
            </div>
            <PackageCheck className="size-7 shrink-0 text-slate-300" />
          </div>

          <div className="space-y-3">
            <p className="line-clamp-2 min-h-10 text-sm text-slate-500">{spec || '暂无规格信息'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn('rounded-md border px-3 py-2', stockTone(quantity))}>
                <div className="text-xs font-medium opacity-80">格口库存</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums">{quantity}</span>
                  <span className="text-xs font-semibold">件</span>
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                <div className="text-xs font-medium text-slate-500">操作类型</div>
                <div className="mt-2 text-base font-bold">{typeLabel}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            {authRequired ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                <LockKeyhole className="size-4" />
                需授权
              </span>
            ) : (
              <span className="text-sm font-medium text-slate-500">普通物品</span>
            )}
            {quantity <= 0 ? (
              <span className="font-semibold text-slate-400">暂无库存</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-base font-bold text-slate-950 group-hover:text-teal-700">
                {ctaText}
                <ArrowRight className="size-5" />
              </span>
            )}
          </div>
        </button>
      </motion.div>
    )
  },
)
GradientItemCard.displayName = 'GradientItemCard'

export { GradientItemCard }
