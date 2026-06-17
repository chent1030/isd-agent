import { memo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">最大 {safeMax}</span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-12 shrink-0"
          disabled={displayValue <= 1}
          onClick={() => setQuantity(displayValue - 1)}
          aria-label="减少数量"
        >
          <Minus />
        </Button>
        <div className="flex h-12 flex-1 items-center justify-center rounded-lg border bg-muted text-2xl font-bold tabular-nums">
          {displayValue}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-12 shrink-0"
          disabled={displayValue >= safeMax}
          onClick={() => setQuantity(displayValue + 1)}
          aria-label="增加数量"
        >
          <Plus />
        </Button>
      </div>

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
