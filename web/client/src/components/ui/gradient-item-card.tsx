'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Package } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { getDisplayInitial } from '@/lib/shared'

const cardVariants = cva(
  'relative flex flex-col justify-between h-full w-full overflow-hidden rounded-2xl p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg',
  {
    variants: {
      gradient: {
        orange: 'bg-gradient-to-br from-orange-100 to-amber-200/50',
        gray: 'bg-gradient-to-br from-slate-100 to-slate-200/50',
        purple: 'bg-gradient-to-br from-purple-100 to-indigo-200/50',
        green: 'bg-gradient-to-br from-emerald-100 to-teal-200/50',
      },
    },
    defaultVariants: {
      gradient: 'gray',
    },
  }
)

export type ItemCardGradient = 'orange' | 'gray' | 'purple' | 'green'

export interface GradientItemCardProps extends VariantProps<typeof cardVariants> {
  /** 自定义类名 */
  className?: string
  /** 物品名（标题） */
  name: string
  /** 规格（描述） */
  spec?: string
  /** 领用类型标签 */
  typeLabel: string
  /** 格口内数量 */
  quantity: number
  /** 是否需要授权（影响 badge） */
  authRequired?: boolean
  /** 主题色（圆点） */
  accent: string
  /** badge 文案 */
  badgeText: string
  /** 点击回调 */
  onSelect?: () => void
  /** 是否禁用（缺货） */
  disabled?: boolean
  /** CTA 文案 */
  ctaText?: string
}

const GradientItemCard = React.forwardRef<HTMLDivElement, GradientItemCardProps>(
  (
    {
      className,
      gradient,
      name,
      spec,
      typeLabel,
      quantity,
      authRequired,
      accent,
      badgeText,
      onSelect,
      disabled = false,
      ctaText = '选择领用',
    },
    ref
  ) => {
    const cardAnimation = {
      rest: { scale: 1, y: 0 },
      hover: disabled ? { scale: 1, y: 0 } : { scale: 1.03, y: -4 },
    }
    const iconAnimation = {
      rest: { scale: 1, rotate: 0 },
      hover: { scale: 1.1, rotate: 8 },
    }
    const initial = getDisplayInitial(name)

    return (
      <motion.div
        variants={cardAnimation}
        initial="rest"
        whileHover="hover"
        animate="rest"
        className={cn('h-full', disabled && 'opacity-50')}
        ref={ref}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          cardVariants({ gradient }),
          'block h-full w-full text-left',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          className
        )}
      >
          {/* 装饰图标（hover 旋转缩放，替代原 demo 的背景图） */}
          <motion.div
            variants={iconAnimation}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="absolute -right-6 -bottom-6 pointer-events-none opacity-40 dark:opacity-20"
          >
            <Package className="h-32 w-32" style={{ color: accent }} strokeWidth={1.2} />
          </motion.div>

          {/* 首字母水印 */}
          <motion.div
            variants={iconAnimation}
            className="absolute right-4 top-4 pointer-events-none"
          >
            <span
              className="flex size-12 items-center justify-center rounded-xl text-2xl font-black text-white shadow-md"
              style={{ backgroundColor: accent }}
            >
              {initial}
            </span>
          </motion.div>

          {/* 内容 */}
          <div className="relative z-10 flex h-full flex-col">
            {/* Badge */}
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/50 px-3 py-1 text-sm font-medium text-foreground/80 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              {badgeText}
            </div>

            {/* 标题 & 描述 */}
            <div className="flex-grow">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/60">
                {typeLabel}
              </div>
              <h3 className="mb-2 text-xl font-bold leading-tight text-foreground line-clamp-2">
                {name}
              </h3>
              <p className="max-w-xs text-sm text-foreground/70 line-clamp-1">
                {spec || '无规格'}
              </p>
            </div>

            {/* 数量 + CTA */}
            <div className="mt-5 flex items-end justify-between border-t border-foreground/10 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-foreground/60">格口内</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tabular-nums text-foreground">
                    {quantity}
                  </span>
                  <span className="text-xs text-foreground/60">件</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                {authRequired && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    需授权
                  </span>
                )}
                {quantity <= 0 ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/40">
                    缺货
                  </span>
                ) : (
                  <span className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {ctaText}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      </motion.div>
    )
  }
)
GradientItemCard.displayName = 'GradientItemCard'

export { GradientItemCard, cardVariants }
