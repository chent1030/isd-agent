'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AnimatedCounterProps {
  /** 当前值（受控） */
  value: number
  /** 是否允许减少 */
  canDecrement?: boolean
  /** 是否允许增加 */
  canIncrement?: boolean
  /** 数值变化时触发 */
  onDecrement?: () => void
  onIncrement?: () => void
  /** 主题色：跟随应用色板 */
  className?: string
  /** 显示的最小位数（左侧补零） */
  padding?: number
}

/**
 * 受控的动画计数器：保留原 demo 的 3D 翻牌 + 弹簧动画 + 流光效果，
 * 但改为受控组件（value + onDecrement/onIncrement），可约束范围。
 * 适配 shadcn 主题变量（primary / destructive），不写死颜色。
 */
export default function AnimatedCounter({
  value,
  canDecrement = true,
  canIncrement = true,
  onDecrement,
  onIncrement,
  className,
  padding = 2,
}: AnimatedCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setDirection(value > prevValueRef.current ? 'up' : 'down')
      setIsAnimating(true)
      const timer = window.setTimeout(() => setIsAnimating(false), 300)
      prevValueRef.current = value
      return () => window.clearTimeout(timer)
    }
  }, [value])

  const springCount = useSpring(value, { stiffness: 100, damping: 15 })
  useEffect(() => { springCount.set(value) }, [springCount, value])

  // 背景随数值插值（朝 primary 色靠拢）
  const backgroundColor = useTransform(
    springCount,
    [0, 50, 100],
    ['var(--card)', 'var(--accent)', 'var(--primary)']
  )

  const handleDecrement = () => {
    if (!canDecrement) return
    setDirection('down')
    setIsAnimating(true)
    onDecrement?.()
  }
  const handleIncrement = () => {
    if (!canIncrement) return
    setDirection('up')
    setIsAnimating(true)
    onIncrement?.()
  }

  // 数字补零 & 负号处理
  const formatNumber = (num: number) => {
    const isNegative = num < 0
    const absNum = Math.abs(num)
    const paddedNum = absNum.toString().padStart(padding, '0')
    return { digits: paddedNum.split(''), isNegative }
  }

  const current = formatNumber(value)
  const previous = formatNumber(prevValueRef.current)
  const showNegative = current.isNegative
  const showPreviousNegative = previous.isNegative
  const isIncreasing = direction === 'up'

  const digitWidth = padding >= 3 ? 'w-6' : 'w-5'

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border border-border bg-card p-6 shadow-lg overflow-hidden',
        className
      )}
      style={{ backgroundColor }}
      animate={{
        scale: isAnimating ? 1.02 : 1,
        rotateX: isAnimating ? 2 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* 流动渐变背景 */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, var(--primary) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 20%, var(--primary) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative flex items-center justify-center gap-4">
        {/* 减少按钮 */}
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          className={cn(
            'relative size-12 shrink-0 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md overflow-hidden group',
            'bg-gradient-to-br from-muted to-muted-foreground/20 text-foreground',
            'hover:from-muted-foreground/20 hover:to-muted-foreground/30',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          whileHover={canDecrement ? { scale: 1.05, rotateZ: -5 } : {}}
          whileTap={canDecrement ? { scale: 0.95 } : {}}
          aria-label="减少"
        >
          <motion.div
            className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            animate={{ rotateZ: isAnimating && direction === 'down' ? [0, -180, 0] : 0 }}
            transition={{ duration: 0.3 }}
          >
            −
          </motion.span>
        </motion.button>

        {/* 数字显示区 */}
        <div className="relative">
          <motion.div
            className="min-w-[120px] h-16 bg-gradient-to-br from-background to-muted rounded-2xl border-2 border-border flex items-center justify-center relative overflow-hidden shadow-inner"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            animate={{
              rotateY: isAnimating ? [0, 5, 0] : 0,
              boxShadow: isAnimating
                ? '0 25px 50px -12px var(--primary), inset 0 2px 4px 0 var(--border)'
                : '0 10px 25px -5px var(--border), inset 0 2px 4px 0 var(--border)',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* 流光 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 dark:via-white/10"
              animate={{
                x: isAnimating ? [-100, 200] : -100,
                opacity: isAnimating ? [0, 0.3, 0] : 0,
              }}
              transition={{ duration: 0.6 }}
            />

            <div className="flex items-center justify-center relative z-10">
              <AnimatePresence>
                {showNegative && (
                  <motion.span
                    key="negative-sign"
                    className="text-2xl font-bold font-mono text-foreground"
                    initial={{ opacity: 0, scale: 0.7, x: 15, rotateX: 90 }}
                    animate={{ opacity: 1, scale: 1, x: 0, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.7, x: 15, rotateX: -90 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    −
                  </motion.span>
                )}
              </AnimatePresence>

              <div className="flex">
                {current.digits.map((digit, index) => {
                  const hasChanged = digit !== previous.digits[index] || showNegative !== showPreviousNegative
                  return (
                    <div
                      key={index}
                      className={cn('relative h-9 flex items-center justify-center overflow-hidden', digitWidth)}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${index}-${digit}-${showNegative}`}
                          className="text-2xl font-bold font-mono absolute text-foreground"
                          initial={hasChanged ? {
                            y: isIncreasing ? -40 : 40,
                            opacity: 0,
                            scale: 0.7,
                            rotateX: isIncreasing ? 90 : -90,
                          } : { y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                          animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                          exit={hasChanged ? {
                            y: isIncreasing ? 40 : -40,
                            opacity: 0,
                            scale: 0.7,
                            rotateX: isIncreasing ? -90 : 90,
                          } : { y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          {digit}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 增加按钮 */}
        <motion.button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          className={cn(
            'relative size-12 shrink-0 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md overflow-hidden group',
            'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
            'hover:from-primary/90 hover:to-primary/70',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          whileHover={canIncrement ? { scale: 1.05, rotateZ: 5 } : {}}
          whileTap={canIncrement ? { scale: 0.95 } : {}}
          aria-label="增加"
        >
          <motion.div
            className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            animate={{
              rotateZ: isAnimating && direction === 'up' ? [0, 180, 0] : 0,
              scale: isAnimating && direction === 'up' ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            +
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  )
}
