'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Boxes, ClipboardList, PackageCheck, PenLine, type LucideIcon } from 'lucide-react'
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
  const accentSoft = hexToRgba(accent, 0.18)
  const accentFaint = hexToRgba(accent, 0.08)
  const accentGlow = hexToRgba(accent, 0.28)

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
        background: `linear-gradient(160deg, #ffffff 0%, ${accentFaint} 52%, #f8fafc 100%)`,
        boxShadow: `0 24px 60px rgba(15, 23, 42, 0.13), 0 16px 36px ${accentGlow}`,
      }}
    >
      <div className="absolute -right-16 -top-16 size-48 rounded-full blur-2xl" style={{ backgroundColor: accentSoft }} />
      <div className="absolute inset-x-8 top-0 h-1.5 rounded-b-full" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col p-6 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-4xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
          </div>

          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: accent, boxShadow: `0 14px 28px ${accentGlow}` }}
          >
            <Icon className="size-9" />
          </div>
        </div>

        <div className="my-8 flex flex-1 items-center justify-center">
          <div
            className="relative flex h-full min-h-[210px] w-full max-w-[340px] items-center justify-center overflow-hidden rounded-[28px]"
            style={{
              background: `radial-gradient(circle at 76% 22%, ${accentSoft}, transparent 30%), linear-gradient(145deg, #ffffff 0%, ${accentFaint} 58%, #f8fafc 100%)`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 18px 36px rgba(15,23,42,0.08)',
            }}
          >
            <div className="absolute -bottom-10 -left-4 text-[9rem] font-black leading-none text-white/80 drop-shadow-sm">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div
              className="relative z-10 flex size-32 items-center justify-center rounded-[2rem] text-white"
              style={{ backgroundColor: accent, boxShadow: `0 22px 42px ${accentGlow}` }}
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
          <span
            className="inline-flex h-12 items-center gap-2 rounded-lg px-5 text-base font-bold text-white transition-transform group-hover:translate-x-1"
            style={{ backgroundColor: '#0f172a', boxShadow: '0 12px 24px rgba(15,23,42,0.18)' }}
          >
            进入
            <ArrowRight className="size-5" />
          </span>
        </div>
      </div>
    </motion.button>
  )
}
