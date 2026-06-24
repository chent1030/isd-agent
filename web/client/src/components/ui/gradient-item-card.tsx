'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Package, ShieldCheck } from 'lucide-react'
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
  gradient?: ItemCardGradient
}

const stockClassName = (quantity: number) => {
  if (quantity <= 0) return {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.24)',
  }
  if (quantity <= 2) return {
    backgroundColor: '#fffbeb',
    color: '#b45309',
    boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.24)',
  }
  return {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.22)',
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return `rgba(15, 23, 42, ${alpha})`
  const value = Number.parseInt(normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
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
    },
    ref,
  ) => {
    const accentSoft = hexToRgba(accent, 0.13)
    const accentFaint = hexToRgba(accent, 0.055)
    const accentGlow = hexToRgba(accent, 0.16)
    const stockStyle = stockClassName(quantity)

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
            'group relative flex h-full w-full overflow-hidden rounded-lg bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            className,
          )}
          style={{
            background: `linear-gradient(150deg, rgba(255,255,255,0.98) 0%, #ffffff 45%, ${accentFaint} 100%)`,
            boxShadow: '0 18px 42px rgba(15, 23, 42, 0.09), 0 6px 18px rgba(15, 23, 42, 0.055), inset 0 1px 0 rgba(255,255,255,0.96)',
          }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full blur-2xl" style={{ backgroundColor: accentSoft }} />
          <div className="pointer-events-none absolute -bottom-16 left-8 size-36 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(accent, 0.07) }} />
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-1 rounded-t-full" style={{ backgroundColor: accent }} />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md px-2.5 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: hexToRgba(accent, 0.1),
                      color: '#334155',
                      boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.035)',
                    }}
                  >
                    {badgeText}
                  </span>
                  {authRequired && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black"
                      style={{ backgroundColor: '#b91c1c', color: '#ffffff' }}
                    >
                      <ShieldCheck className="size-3.5" />
                      需授权
                    </span>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
              </div>
              <div
                className="rounded-lg p-2 text-white"
                style={{
                  background: `linear-gradient(145deg, ${hexToRgba(accent, 0.88)}, ${accent})`,
                  boxShadow: `0 12px 24px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.24)`,
                }}
              >
                <Package className="size-5" />
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 pt-3">
              <div className="rounded-lg px-3 py-2" style={stockStyle}>
                <div className="text-xs font-bold opacity-80">库存</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums">{quantity}</span>
                  <span className="text-xs font-bold">件</span>
                </div>
              </div>

              {quantity <= 0 && (
                <span
                  className="rounded-lg px-3 py-2 text-sm font-bold"
                  style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                >
                  暂无库存
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
