'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Boxes, Layers3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDisplayInitial } from '@/lib/shared'

export interface GlassCategoryCardProps {
  name: string
  itemCount?: number
  accent?: string
  tags?: string[]
  onSelect?: () => void
  index?: number
  className?: string
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
  const initial = getDisplayInitial(name)

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.035 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative flex h-full w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-slate-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        className,
      )}
    >
      <div className="w-2 shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md text-2xl font-black text-white" style={{ backgroundColor: accent }}>
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                {(tags?.length ? tags : ['分类入口']).map(tag => (
                  <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
            </div>
          </div>
          <div className="rounded-md bg-slate-100 p-2.5 text-slate-500 transition-colors group-hover:bg-slate-950 group-hover:text-white">
            <Layers3 className="size-6" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3 border-t border-slate-200 pt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <Boxes className="size-4" />
              物品目录
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-4xl font-black tabular-nums text-slate-950">{itemCount}</span>
              <span className="text-sm font-semibold text-slate-500">种</span>
            </div>
          </div>
          <span className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition-colors group-hover:bg-teal-700">
            进入
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </motion.button>
  )
}
