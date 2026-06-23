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
  const minimum = 2 + (index % 2)
  const fromCount = Math.min(4, Math.max(2, Math.ceil(itemCount / 4)))
  return Math.min(4, Math.max(minimum, fromCount))
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
  const filledBars = getFilledSlots(itemCount, index)

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
          <div className="relative flex h-full min-h-[190px] w-full max-w-[330px] flex-col justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="absolute right-5 top-5 flex size-14 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
              <Icon className="size-8" />
            </div>
            <div className="absolute -bottom-8 -left-2 text-[8rem] font-black leading-none text-slate-200/70">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="relative z-10 space-y-4">
              {Array.from({ length: 4 }).map((_, barIndex) => {
                const filled = barIndex < filledBars
                const width = `${92 - barIndex * 12}%`
                return (
                  <div key={barIndex} className="flex items-center gap-3">
                    <div
                      className="h-4 rounded-full"
                      style={{
                        width,
                        backgroundColor: filled ? accent : '#e2e8f0',
                        opacity: filled ? 0.95 : 1,
                      }}
                    />
                    <div
                      className="size-4 rounded-full"
                      style={{
                        backgroundColor: filled ? accent : '#cbd5e1',
                        opacity: filled ? 0.95 : 1,
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="relative z-10 mt-6 h-2 w-24 rounded-full" style={{ backgroundColor: accent }} />
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
