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

function getFilledSlots(itemCount: number, index: number) {
  const minimum = 4 + (index % 3)
  const fromCount = Math.min(9, Math.max(3, Math.ceil(itemCount / 2)))
  return Math.min(9, Math.max(minimum, fromCount))
}

export function GlassCategoryCard({
  name,
  itemCount = 0,
  accent = '#0f766e',
  tags,
  onSelect,
  index = 0,
  className,
}: GlassCategoryCardProps) {
  const Icon = getCategoryIcon(name)
  const filledSlots = getFilledSlots(itemCount, index)

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
            <div className="flex flex-wrap gap-2">
              {(tags?.length ? tags : ['主入口']).map(tag => (
                <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="mt-4 line-clamp-2 text-4xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
          </div>

          <div className="flex size-16 shrink-0 items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: accent }}>
            <Icon className="size-9" />
          </div>
        </div>

        <div className="my-8 flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, slotIndex) => {
              const filled = slotIndex < filledSlots
              return (
                <div
                  key={slotIndex}
                  className="aspect-square rounded-lg border shadow-inner"
                  style={{
                    borderColor: filled ? accent : '#e2e8f0',
                    background: filled ? accent : '#f8fafc',
                    opacity: filled ? 0.95 : 1,
                  }}
                />
              )
            })}
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
