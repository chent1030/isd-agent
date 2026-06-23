'use client'

import { motion } from 'framer-motion'
import { Fragment } from 'react'
import { ArrowRight, Boxes, ClipboardList, PackageCheck, PenLine, type LucideIcon } from 'lucide-react'
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

interface CategoryVisual {
  icon: LucideIcon
  subtitle: string
  points: string[]
  flow: string[]
}

function getCategoryVisual(name: string): CategoryVisual {
  if (name.includes('接待')) {
    return {
      icon: ClipboardList,
      subtitle: '访客接待、会议准备、临时招待用品',
      points: ['会议接待', '访客使用', '临时补给'],
      flow: ['选品', '确认', '开柜'],
    }
  }

  if (name.includes('前台')) {
    return {
      icon: PackageCheck,
      subtitle: '前台日常作业、登记流转、备用工具',
      points: ['日常值守', '登记交接', '快速取用'],
      flow: ['定位', '取用', '记录'],
    }
  }

  if (name.includes('文具')) {
    return {
      icon: PenLine,
      subtitle: '办公书写、标记整理、基础耗材',
      points: ['书写工具', '整理耗材', '办公补充'],
      flow: ['浏览', '领用', '完成'],
    }
  }

  return {
    icon: Boxes,
    subtitle: '柜机物品分类入口',
    points: ['分类浏览', '库存查看', '快速领用'],
    flow: ['选择', '认证', '开柜'],
  }
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
  const visual = getCategoryVisual(name)
  const Icon = visual.icon

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
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg text-3xl font-black text-white shadow-sm" style={{ backgroundColor: accent }}>
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {(tags?.length ? tags : ['主入口']).map(tag => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mt-3 line-clamp-2 text-3xl font-black leading-tight tracking-normal text-slate-950">{name}</h3>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 p-3 text-slate-600 transition-colors group-hover:bg-slate-950 group-hover:text-white">
            <Icon className="size-8" />
          </div>
        </div>

        <p className="mt-5 line-clamp-2 min-h-12 text-base font-medium leading-relaxed text-slate-500">
          {visual.subtitle}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {visual.points.map(point => (
            <div key={point} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="mb-2 h-1.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
              <div className="text-sm font-bold text-slate-700">{point}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">取用流程</span>
            <span className="text-xs font-semibold text-slate-400">TOUCH TERMINAL</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
            {visual.flow.map((step, stepIndex) => (
              <Fragment key={step}>
                <div className="rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-700">
                  {step}
                </div>
                {stepIndex < visual.flow.length - 1 && (
                  <div className="h-px w-5 bg-slate-300" />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-200 pt-5">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <Boxes className="size-4" />
              当前目录
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-black tabular-nums text-slate-950">{itemCount}</span>
              <span className="text-base font-bold text-slate-500">种物品</span>
            </div>
          </div>
          <span className="inline-flex h-12 items-center gap-2 rounded-lg bg-slate-950 px-5 text-base font-bold text-white transition-colors group-hover:bg-teal-700">
            进入分类
            <ArrowRight className="size-5" />
          </span>
        </div>
      </div>
    </motion.button>
  )
}
