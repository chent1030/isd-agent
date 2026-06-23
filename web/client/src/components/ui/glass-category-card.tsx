'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Boxes } from 'lucide-react'
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group flex h-full min-h-[260px] w-full flex-col justify-between rounded-lg border bg-white p-5 text-left shadow-sm transition-all hover:border-slate-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-16 items-center justify-center rounded-md text-3xl font-black text-white shadow-sm" style={{ backgroundColor: accent }}>
          {initial}
        </div>
        <div className="rounded-md bg-slate-100 p-3 text-slate-500 group-hover:bg-slate-900 group-hover:text-white">
          <Boxes className="size-7" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(tags?.length ? tags : [`${itemCount} 种物品`]).map(tag => (
            <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
        <div>
          <h3 className="line-clamp-2 text-3xl font-bold tracking-normal text-slate-950">{name}</h3>
          <p className="mt-2 text-base text-slate-500">查看该分类下可领用、可借用物品</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <div>
          <div className="text-sm text-slate-500">当前物品数</div>
          <div className="text-4xl font-black tabular-nums text-slate-950">{itemCount}</div>
        </div>
        <span className="inline-flex h-12 items-center gap-2 rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition-colors group-hover:bg-teal-700">
          进入
          <ArrowRight className="size-5" />
        </span>
      </div>
    </motion.button>
  )
}
