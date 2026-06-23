'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from 'sonner'
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'error' | 'warning'
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface ActionButton {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
}

interface ToasterProps {
  title?: string
  message: string
  variant?: Variant
  duration?: number
  position?: Position
  actions?: ActionButton
  onDismiss?: () => void
  highlightTitle?: boolean
}

export interface ToasterRef {
  show: (props: ToasterProps) => void
}

const variantStyles: Record<Variant, string> = {
  default: 'border-slate-300 bg-white text-slate-950',
  success: 'border-green-600 bg-green-50 text-green-950',
  error: 'border-red-700 bg-red-50 text-red-950',
  warning: 'border-amber-600 bg-amber-50 text-amber-950',
}

const titleColor: Record<Variant, string> = {
  default: 'text-slate-950',
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
}

const iconColor: Record<Variant, string> = {
  default: 'text-slate-600',
  success: 'text-green-700',
  error: 'text-red-700',
  warning: 'text-amber-700',
}

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
}

const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.95 },
}

const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
  ({ defaultPosition = 'bottom-right' }, ref) => {
    const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(null)

    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = 'default',
        duration = 4000,
        position = defaultPosition,
        actions,
        onDismiss,
        highlightTitle,
      }) {
        const Icon = variantIcons[variant]

        toastReference.current = sonnerToast.custom(
          (toastId) => (
            <motion.div
              variants={toastAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ zIndex: 12000 }}
              className={cn(
                'relative z-[12000] flex w-full max-w-sm items-center justify-between rounded-lg border p-4 shadow-2xl',
                variantStyles[variant]
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor[variant])} />
                <div className="space-y-0.5">
                  {title && (
                    <h3
                      className={cn(
                        'text-base font-black leading-tight',
                        titleColor[variant],
                        highlightTitle && titleColor['success'] // override for meeting case
                      )}
                    >
                      {title}
                    </h3>
                  )}
                  <p className="text-sm font-semibold text-slate-800">{message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {actions?.label && (
                  <Button
                    variant={actions.variant || 'outline'}
                    size="sm"
                    onClick={() => {
                      actions.onClick()
                      sonnerToast.dismiss(toastId)
                    }}
                    className={cn(
                      'cursor-pointer',
                      variant === 'success'
                        ? 'text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20'
                        : variant === 'error'
                        ? 'text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                        : variant === 'warning'
                        ? 'text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20'
                        : 'text-foreground border-border hover:bg-muted/10 dark:hover:bg-muted/20'
                    )}
                  >
                    {actions.label}
                  </Button>
                )}

                <button
                  onClick={() => {
                    sonnerToast.dismiss(toastId)
                    onDismiss?.()
                  }}
                  className="rounded-full p-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ),
          { duration, position }
        )
      },
    }))

    return (
      <SonnerToaster
        className="z-[12000]"
        position={defaultPosition}
        style={{ zIndex: 12000 }}
        toastOptions={{ unstyled: true, className: 'z-[12000] flex justify-end' }}
      />
    )
  }
)

Toaster.displayName = 'Toaster'

export default Toaster

// =============================================================================
// 全局命令式适配器：让业务代码继续用 toast.success/error/info/warning('msg')
// 但渲染走上面的新 Toaster 视觉。
// =============================================================================

type CallVariant = 'success' | 'error' | 'info' | 'warning' | 'default'

const variantMap: Record<CallVariant, Variant> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  default: 'default',
  info: 'default',
}

// 全局持有 Toaster 实例引用
let toasterRef: ToasterRef | null = null

export function registerToaster(ref: ToasterRef | null) {
  toasterRef = ref
}

function emit(message: string, variant: CallVariant, title?: string) {
  const props = {
    message,
    variant: variantMap[variant],
    title,
    position: 'top-center',
    duration: 4000,
  } as const

  if (toasterRef) {
    toasterRef.show(props)
    return
  }

  sonnerToast(message, {
    position: 'top-center',
    duration: 4000,
  })
}

/**
 * 全局 toast 对象，API 与 sonner 原生 toast 兼容：
 *   toast.success('msg') / toast.error('msg') / toast.info('msg') / toast.warning('msg')
 *   toast.message('msg')
 * 另外支持带标题的写法：
 *   toast.show({ title, message, variant })
 */
export const toast = Object.assign(
  (message: string) => emit(message, 'default'),
  {
    success: (message: string, title?: string) => emit(message, 'success', title),
    error: (message: string, title?: string) => emit(message, 'error', title),
    warning: (message: string, title?: string) => emit(message, 'warning', title),
    info: (message: string, title?: string) => emit(message, 'info', title),
    message: (message: string) => emit(message, 'default'),
    show: (props: ToasterProps) => toasterRef?.show(props),
    dismiss: sonnerToast.dismiss,
  }
)

export type { Variant, Position, ActionButton, ToasterProps }

// 适配 React 19：framer-motion 的 AnimatePresence 在某些版本需要显式引入，
// 这里保留导入以避免 tree-shaking 误删（实际由 sonnerToast.custom 管理 unmount）
void AnimatePresence
void useEffect
