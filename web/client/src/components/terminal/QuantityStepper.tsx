import { memo } from 'react'
import { Button } from '@/components/ui/button'
import AnimatedCounter from '@/components/ui/animated-counter'
import { clampQuantity } from '@/lib/shared'

interface QuantityStepperProps {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
}

export const QuantityStepper = memo(function QuantityStepper({
  label,
  value,
  max,
  onChange,
}: QuantityStepperProps) {
  const safeMax = Math.max(Math.floor(max) || 1, 1)
  const displayValue = clampQuantity(value, safeMax)
  const quickValues = safeMax <= 6
    ? Array.from({ length: safeMax }, (_, index) => index + 1)
    : [1, 2, 3, 5].filter(item => item <= safeMax)

  const setQuantity = (next: number) => onChange(clampQuantity(next, safeMax))

  // 按最大值决定补零位数，保证数字居中不跳动
  const padding = safeMax >= 100 ? 3 : safeMax >= 10 ? 2 : 2

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">最大 {safeMax}</span>
      </div>

      <AnimatedCounter
        value={displayValue}
        padding={padding}
        canDecrement={displayValue > 1}
        canIncrement={displayValue < safeMax}
        onDecrement={() => setQuantity(displayValue - 1)}
        onIncrement={() => setQuantity(displayValue + 1)}
      />

      <div className="flex flex-wrap gap-2">
        {quickValues.map(item => (
          <Button
            key={item}
            type="button"
            variant={displayValue === item ? 'default' : 'outline'}
            size="sm"
            className="min-w-12"
            onClick={() => setQuantity(item)}
          >
            {item}
          </Button>
        ))}
        {safeMax > 6 && (
          <Button
            type="button"
            variant={displayValue === safeMax ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuantity(safeMax)}
          >
            全部 ({safeMax})
          </Button>
        )}
      </div>
    </div>
  )
})
