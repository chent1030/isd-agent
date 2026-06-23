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
  const showKeypad = safeMax > 6

  const setQuantity = (next: number) => onChange(clampQuantity(next, safeMax))
  const appendDigit = (digit: number) => {
    const nextText = `${displayValue === 0 ? '' : displayValue}${digit}`
    setQuantity(Number(nextText))
  }
  const removeDigit = () => setQuantity(Math.floor(displayValue / 10) || 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        <span className="text-sm text-slate-500">最多 {safeMax}</span>
      </div>

      <div className="grid grid-cols-[4rem_1fr_4rem] items-stretch overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <button
          type="button"
          disabled={displayValue <= 1}
          className="flex min-h-16 items-center justify-center transition-colors disabled:cursor-not-allowed"
          style={displayValue <= 1 ? { backgroundColor: '#e2e8f0', color: '#94a3b8' } : { backgroundColor: '#f1f5f9', color: '#0f172a' }}
          onClick={() => setQuantity(displayValue - 1)}
          aria-label="减少"
        >
          <Minus className="size-8" strokeWidth={3} />
        </button>
        <div className="flex min-h-16 items-center justify-center bg-white text-5xl font-black tabular-nums text-slate-950">
          {displayValue}
        </div>
        <button
          type="button"
          disabled={displayValue >= safeMax}
          className="flex min-h-16 items-center justify-center transition-colors disabled:cursor-not-allowed"
          style={displayValue >= safeMax ? { backgroundColor: '#e2e8f0', color: '#94a3b8' } : { backgroundColor: '#0f766e', color: '#ffffff' }}
          onClick={() => setQuantity(displayValue + 1)}
          aria-label="增加"
        >
          <Plus className="size-8" strokeWidth={3} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickValues.map(item => {
          const active = displayValue === item
          return (
            <Button
              key={item}
              type="button"
              variant={active ? 'default' : 'outline'}
              size="lg"
              className="min-w-14"
              style={active ? { backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#ffffff' } : undefined}
              onClick={() => setQuantity(item)}
            >
              {item}
            </Button>
          )
        })}
        {safeMax > 6 && (
          <Button
            type="button"
            variant={displayValue === safeMax ? 'default' : 'outline'}
            size="lg"
            style={displayValue === safeMax ? { backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#ffffff' } : undefined}
            onClick={() => setQuantity(safeMax)}
          >
            全部 ({safeMax})
          </Button>
        )}
      </div>

      {showKeypad && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(item => (
            <button
              type="button"
              key={item}
              className="h-12 rounded-lg text-lg font-black shadow-sm"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              onClick={() => appendDigit(item)}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            className="h-12 rounded-lg text-sm font-black shadow-sm"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            onClick={() => setQuantity(1)}
          >
            清空
          </button>
          <button
            type="button"
            className="h-12 rounded-lg text-lg font-black shadow-sm"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            onClick={() => appendDigit(0)}
          >
            0
          </button>
          <button
            type="button"
            className="h-12 rounded-lg text-sm font-black shadow-sm"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            onClick={removeDigit}
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
})
