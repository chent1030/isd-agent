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
  const accentSoft = hexToRgba(accent, 0.1)
  const accentFaint = hexToRgba(accent, 0.06)

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
        'group relative flex h-full min-h-[360px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-slate-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col p-6 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-4xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
          </div>

          <div className="flex size-16 shrink-0 items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: accent }}>
            <Icon className="size-9" />
          </div>
        </div>

        <div className="my-8 flex flex-1 items-center justify-center">
          <div
            className="relative flex h-full min-h-[210px] w-full max-w-[340px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            style={{
              background: `linear-gradient(145deg, ${accentFaint} 0%, #f8fafc 48%, #ffffff 100%)`,
            }}
          >
            <div className="absolute -right-8 -top-8 size-36 rounded-[2rem]" style={{ backgroundColor: accentSoft }} />
            <div className="absolute -bottom-10 -left-4 text-[9rem] font-black leading-none text-slate-200/80">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="relative z-10 flex size-32 items-center justify-center rounded-3xl text-white shadow-lg shadow-slate-300/40" style={{ backgroundColor: accent }}>
              <Icon className="size-16" />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-slate-200 pt-5">
          <div>
            <div className="text-sm font-semibold text-slate-500">当前目录</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-6xl font-black tabular-nums text-slate-950">{itemCount}</span>
              <span className="text-base font-bold text-slate-500">种</span>
            </div>
          </div>
          <span className="inline-flex h-12 items-center gap-2 rounded-lg bg-slate-950 px-5 text-base font-bold text-white transition-colors group-hover:bg-teal-700">
            进入
            <ArrowRight className="size-5" />
          </span>
        </div>
      </div>
    </motion.button>
  )
}
