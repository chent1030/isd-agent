import { memo, useEffect, useState } from 'react'
import type { CabinetCatalogItem } from '../../types/electron'
import type { OperationMode, Operator } from '../../types/terminal'
import { FaceGate } from './FaceGate'
import { QuantityPicker } from './QuantityPicker'

interface ItemDialogProps {
  item: CabinetCatalogItem
  operating: boolean
  onClose: () => void
  onOperate: (item: CabinetCatalogItem, mode: OperationMode, quantity: number, operator: Operator) => Promise<void>
}

export const ItemDialog = memo(function ItemDialog({
  item,
  operating,
  onClose,
  onOperate,
}: ItemDialogProps) {
  const [mode, setMode] = useState<OperationMode>(item.useType === 1 ? 'borrow' : 'receive')
  const [quantity, setQuantity] = useState(1)
  const [step, setStep] = useState<'quantity' | 'face'>('quantity')
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(item.useType === 1 ? 'borrow' : 'receive')
    setQuantity(1)
    setStep('quantity')
    setError('')
  }, [item])

  const maxQuantity = Math.max(item.cabinetQuantity, 1)
  const canReceiveItem = item.cabinetQuantity > 0 && item.useType !== 1
  const canBorrowItem = item.cabinetQuantity > 0 && (item.useType === 1 || item.useType === 2)
  const canSwitchMode = item.useType === 2
  const operationLabel = mode === 'receive' ? '领用' : '借用'
  const canProceed = quantity > 0 && quantity <= maxQuantity && !operating && (mode === 'receive' ? canReceiveItem : canBorrowItem)

  const proceedToFace = () => {
    if (item.cabinetQuantity <= 0) {
      setError('柜内可领数量不足，请联系管理员补货')
      return
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`请选择 1 到 ${maxQuantity} 之间的数量`)
      return
    }
    setError('')
    setStep('face')
  }

  const handleAuthenticated = async (operator: Operator) => {
    setError('')
    await onOperate(item, mode, quantity, operator)
  }

  return (
    <div className="twin-modal-backdrop" role="dialog" aria-modal="true">
      <section className="twin-modal twin-item-dialog">
        <header className="twin-modal-header">
          <div>
            <span>{item.category || '未分类'}</span>
            <h3>{item.name}</h3>
          </div>
          <button type="button" className="twin-icon-button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className={step === 'quantity' ? 'twin-item-dialog-grid twin-item-dialog-quantity' : 'twin-item-dialog-grid'}>
          <div className="twin-slot-facts">
            <div>
              <span>格口内数量</span>
              <strong>{item.cabinetQuantity}</strong>
            </div>
            <div>
              <span>规格</span>
              <strong>{item.spec || '--'}</strong>
            </div>
            <div>
              <span>授权</span>
              <strong className={item.authRequired ? 'is-auth-required' : ''}>{item.authRequired ? '需要授权' : '无需授权'}</strong>
            </div>
          </div>

          <div className="twin-operation-panel">
            {step === 'quantity' ? (
              <>
                {canSwitchMode && (
                  <div className="twin-segmented">
                    <button
                      type="button"
                      className={mode === 'receive' ? 'is-active' : ''}
                      disabled={!canReceiveItem}
                      onClick={() => setMode('receive')}
                    >
                      领用
                    </button>
                    <button
                      type="button"
                      className={mode === 'borrow' ? 'is-active' : ''}
                      disabled={!canBorrowItem}
                      onClick={() => setMode('borrow')}
                    >
                      借用
                    </button>
                  </div>
                )}

                <QuantityPicker
                  label="选择数量"
                  value={quantity}
                  max={maxQuantity}
                  onChange={setQuantity}
                />
              </>
            ) : (
              <FaceGate onAuthenticated={handleAuthenticated} />
            )}

            {error && <div className="twin-error">{error}</div>}

            <div className="twin-dialog-actions">
              {step === 'face' && (
                <button type="button" className="twin-secondary-action" disabled={operating} onClick={() => setStep('quantity')}>
                  返回修改数量
                </button>
              )}
              <button type="button" className="twin-secondary-action" onClick={onClose}>取消</button>
              {step === 'quantity' && (
                <button type="button" className="twin-primary-action" disabled={!canProceed} onClick={proceedToFace}>
                  {operationLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
})
