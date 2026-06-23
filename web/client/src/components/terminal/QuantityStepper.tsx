import { memo } from 'react'
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
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        <span className="text-sm text-slate-500">最多 {safeMax}</span>
      </div>

      <div className="grid grid-cols-[4rem_1fr_4rem] items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          disabled={displayValue <= 1}
          className="flex min-h-16 items-center justify-center bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-300"
          onClick={() => setQuantity(displayValue - 1)}
          aria-label="减少"
        >
          <Minus className="size-7" />
        </button>
        <div className="flex min-h-16 items-center justify-center bg-white text-5xl font-black tabular-nums text-slate-950">
          {displayValue}
        </div>
        <button
          type="button"
          disabled={displayValue >= safeMax}
          className="flex min-h-16 items-center justify-center bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          onClick={() => setQuantity(displayValue + 1)}
          aria-label="增加"
        >
          <Plus className="size-7" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickValues.map(item => (
          <Button
            key={item}
            type="button"
            variant={displayValue === item ? 'default' : 'outline'}
            size="lg"
            className="min-w-14"
            onClick={() => setQuantity(item)}
          >
            {item}
          </Button>
        ))}
        {safeMax > 6 && (
          <Button
            type="button"
            variant={displayValue === safeMax ? 'default' : 'outline'}
            size="lg"
            onClick={() => setQuantity(safeMax)}
          >
            全部 ({safeMax})
          </Button>
        )}
      </div>
    </div>
  )
})
