import { memo } from 'react'
import { Minus, Plus } from 'lucide-react'
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
        <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: '#4b6475' }}>最大 {safeMax}</span>
      </div>

      <div className="grid grid-cols-[4.75rem_1fr_4.75rem] items-stretch overflow-hidden rounded-lg shadow-sm ring-1" style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 22px rgba(15,23,42,0.08)' }}>
        <button
          type="button"
          disabled={displayValue <= 1}
          className="flex min-h-16 items-center justify-center transition disabled:cursor-not-allowed"
          style={displayValue <= 1
            ? { backgroundColor: '#dbe4ea', color: '#7b8d9a' }
            : { backgroundColor: '#eef3f6', color: '#10233a' }}
          onClick={() => setQuantity(displayValue - 1)}
          aria-label="减少"
        >
          <Minus className="size-8" strokeWidth={3} />
        </button>
        <div className="flex min-h-16 items-center justify-center text-5xl font-black tabular-nums" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          {displayValue}
        </div>
        <button
          type="button"
          disabled={displayValue >= safeMax}
          className="flex min-h-16 items-center justify-center transition disabled:cursor-not-allowed"
          style={displayValue >= safeMax
            ? { backgroundColor: '#dbe4ea', color: '#7b8d9a' }
            : { backgroundColor: '#08735f', color: '#ffffff' }}
          onClick={() => setQuantity(displayValue + 1)}
          aria-label="增加"
        >
          <Plus className="size-8" strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {quickValues.map(item => {
          const active = displayValue === item
          return (
            <button
              key={item}
              type="button"
              className="h-11 rounded-md text-base font-black shadow-sm transition"
              style={active
                ? { backgroundColor: '#111827', color: '#ffffff' }
                : { backgroundColor: '#f8fafc', color: '#10233a', boxShadow: 'inset 0 0 0 1px #cbd5e1' }}
              onClick={() => setQuantity(item)}
            >
              {item}
            </button>
          )
        })}
        <button
          type="button"
          className="h-11 rounded-md text-sm font-black shadow-sm transition"
          style={displayValue === safeMax
            ? { backgroundColor: '#111827', color: '#ffffff' }
            : { backgroundColor: '#f8fafc', color: '#10233a', boxShadow: 'inset 0 0 0 1px #cbd5e1' }}
          onClick={() => setQuantity(safeMax)}
        >
          全部
        </button>
      </div>

      {showKeypad && (
        <div className="grid grid-cols-3 gap-2 rounded-lg p-2" style={{ backgroundColor: '#e5edf2' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(item => (
            <button
              type="button"
              key={item}
              className="h-11 rounded-md text-xl font-black shadow-sm transition active:scale-[0.98]"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              onClick={() => appendDigit(item)}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            className="h-11 rounded-md text-sm font-black shadow-sm transition active:scale-[0.98]"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            onClick={() => setQuantity(1)}
          >
            清空
          </button>
          <button
            type="button"
            className="h-11 rounded-md text-xl font-black shadow-sm transition active:scale-[0.98]"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            onClick={() => appendDigit(0)}
          >
            0
          </button>
          <button
            type="button"
            className="h-11 rounded-md text-sm font-black shadow-sm transition active:scale-[0.98]"
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
