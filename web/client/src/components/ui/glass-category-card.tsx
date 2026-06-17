'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDisplayInitial } from '@/lib/shared'

export interface GlassCategoryCardProps {
  /** 分类名称 */
  name: string
  /** 物品数量 */
  itemCount?: number
  /** 主题色（十六进制） */
  accent?: string
  /** 标签 */
  tags?: string[]
  /** 点击回调 */
  onSelect?: () => void
  /** 入场动画延迟 */
  index?: number
  className?: string
}

/**
 * 玻璃拟态分类卡片：保留原 GlassBlogCard 的毛玻璃 + framer-motion 入场
 * + 图片区 hover 缩放 + 遮罩渐变 + hover 浮现操作按钮。
 * 内容区改为分类数据：首字母色块替代图片、物品数替代作者信息。
 */
export function GlassCategoryCard({
  name,
  itemCount,
  accent = '#2f8f67',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn('group relative w-full text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-2xl', className)}
    >
      <Card className="group relative h-full overflow-hidden rounded-2xl border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
        {/* 顶部色块区（替代博客图片） */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {/* 首字母大色块 */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            }}
          >
            <span className="text-7xl font-black text-white/95 drop-shadow-lg select-none">
              {initial}
            </span>
          </div>

          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

          {/* 顶部标签 */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {tags?.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* hover 浮现的进入按钮 */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
            >
              进入分类
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              {name}
            </h3>
            <p className="line-clamp-1 text-sm text-muted-foreground">
              共 {itemCount ?? 0} 种物品可领用
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {initial}
              </span>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground">物品领用</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-lg font-bold text-foreground tabular-nums">
                {itemCount ?? 0}
              </span>
              <span>种</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.button>
  )
}
