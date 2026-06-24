'use client'

import { motion } from 'framer-motion'
import { Boxes, ClipboardList, PackageCheck, PenLine, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GlassCategoryCardProps {
  name: string
  itemCount?: number
  accent?: string
  tags?: string[]
  onSelect?: () => void
  index?: number
  className?: string
}

function getCategoryIcon(name: string): LucideIcon {
  if (name.includes('接待')) return ClipboardList
  if (name.includes('前台')) return PackageCheck
  if (name.includes('文具')) return PenLine
  return Boxes
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

export function GlassCategoryCard({
  name,
  itemCount = 0,
  accent = '#0f766e',
  onSelect,
  index = 0,
  className,
}: GlassCategoryCardProps) {
  const Icon = getCategoryIcon(name)
  const accentSoft = hexToRgba(accent, 0.14)
  const accentFaint = hexToRgba(accent, 0.055)
  const accentGlow = hexToRgba(accent, 0.18)

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.045 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative flex h-full min-h-[360px] w-full overflow-hidden rounded-lg bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        className,
      )}
      style={{
        background: `linear-gradient(155deg, rgba(255,255,255,0.98) 0%, #ffffff 40%, ${accentFaint} 100%)`,
        boxShadow: '0 26px 60px rgba(15, 23, 42, 0.10), 0 8px 22px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      <div className="absolute -right-20 -top-20 size-56 rounded-full blur-3xl" style={{ backgroundColor: accentSoft }} />
      <div className="absolute -bottom-24 left-8 size-52 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(accent, 0.08) }} />
      <div className="absolute inset-x-10 top-0 h-1 rounded-b-full" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col p-6 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-4xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
          </div>

          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-lg text-white"
            style={{
              background: `linear-gradient(145deg, ${hexToRgba(accent, 0.92)}, ${accent})`,
              boxShadow: `0 16px 34px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.28)`,
            }}
          >
            <Icon className="size-9" />
          </div>
        </div>

        <div className="my-8 flex flex-1 items-center justify-center">
          <div
            className="relative flex h-full min-h-[210px] w-full max-w-[340px] items-center justify-center overflow-hidden rounded-[28px]"
            style={{
              background: `radial-gradient(circle at 78% 20%, ${accentSoft}, transparent 32%), linear-gradient(145deg, rgba(255,255,255,0.96) 0%, ${accentFaint} 62%, #f8fafc 100%)`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -1px 0 rgba(15,23,42,0.035), 0 18px 38px rgba(15,23,42,0.075)',
            }}
          >
            <div className="absolute -bottom-10 -left-4 text-[9rem] font-black leading-none text-white/80 drop-shadow-sm">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div
              className="relative z-10 flex size-32 items-center justify-center rounded-[2rem] text-white"
              style={{
                background: `linear-gradient(145deg, ${hexToRgba(accent, 0.9)}, ${accent})`,
                boxShadow: `0 24px 46px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.26)`,
              }}
            >
              <Icon className="size-16" />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between pt-5">
          <div>
            <div className="text-sm font-semibold text-slate-500">当前目录</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-6xl font-black tabular-nums text-slate-950">{itemCount}</span>
              <span className="text-base font-bold text-slate-500">种</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
