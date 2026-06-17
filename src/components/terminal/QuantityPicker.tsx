import { memo } from 'react'
import { clampQuantity } from './shared'

interface QuantityPickerProps {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
}

export const QuantityPicker = memo(function QuantityPicker({
  label,
  value,
  max,
  onChange,
}: QuantityPickerProps) {
  const safeMax = Math.max(Math.floor(max) || 1, 1)
  const quickValues = safeMax <= 6
    ? Array.from({ length: safeMax }, (_, index) => index + 1)
    : [1, 2, 3, 5].filter(item => item <= safeMax)
  const showKeypad = safeMax > 6
  const displayValue = clampQuantity(value, safeMax)

  const setQuantity = (nextValue: number) => onChange(clampQuantity(nextValue, safeMax))
  const appendDigit = (digit: number) => {
    const nextText = `${displayValue === 0 ? '' : displayValue}${digit}`
    setQuantity(Number(nextText))
  }
  const removeDigit = () => setQuantity(Math.floor(displayValue / 10) || 1)

  return (
    <div className="twin-touch-quantity" aria-label={label}>
      <div className="twin-touch-quantity-label">
        <span>{label}</span>
        <em>最大 {safeMax}</em>
      </div>

      <div className="twin-touch-stepper">
        <button type="button" disabled={displayValue <= 1} onClick={() => setQuantity(displayValue - 1)} aria-label="减少数量">
          -
        </button>
        <output>{displayValue}</output>
        <button type="button" disabled={displayValue >= safeMax} onClick={() => setQuantity(displayValue + 1)} aria-label="增加数量">
          +
        </button>
      </div>

      <div className="twin-touch-quick-values">
        {quickValues.map(item => (
          <button
            type="button"
            key={item}
            className={displayValue === item ? 'is-active' : ''}
            onClick={() => setQuantity(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className={displayValue === safeMax ? 'is-active' : ''}
          onClick={() => setQuantity(safeMax)}
        >
          全部
        </button>
      </div>

      {showKeypad && (
        <div className="twin-touch-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(item => (
            <button type="button" key={item} onClick={() => appendDigit(item)}>
              {item}
            </button>
          ))}
          <button type="button" onClick={() => setQuantity(1)}>清空</button>
          <button type="button" onClick={() => appendDigit(0)}>0</button>
          <button type="button" onClick={removeDigit}>删除</button>
        </div>
      )}
    </div>
  )
})
