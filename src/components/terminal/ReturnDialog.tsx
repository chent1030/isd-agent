import { memo, useEffect, useMemo, useState } from 'react'
import type { BorrowRecord } from '../../types/electron'
import type { Operator } from '../../types/terminal'
import { FaceGate } from './FaceGate'
import { QuantityPicker } from './QuantityPicker'
import { formatDateTime } from './shared'

interface ReturnDialogProps {
  records: BorrowRecord[]
  loading: boolean
  operating: boolean
  onClose: () => void
  onAuthenticated: (operator: Operator) => Promise<void>
  onReturn: (record: BorrowRecord, quantity: number) => Promise<void>
}

export const ReturnDialog = memo(function ReturnDialog({
  records,
  loading,
  operating,
  onClose,
  onAuthenticated,
  onReturn,
}: ReturnDialogProps) {
  const [operator, setOperator] = useState<Operator | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  const selected = useMemo(
    () => records.find(record => String(record.id) === selectedId) || records[0] || null,
    [records, selectedId],
  )

  useEffect(() => {
    if (!selectedId && records[0]) setSelectedId(String(records[0].id))
  }, [records, selectedId])

  useEffect(() => {
    setQuantity(selected?.pendingQuantity || 1)
  }, [selected])

  const handleAuthenticated = async (nextOperator: Operator) => {
    setOperator(nextOperator)
    await onAuthenticated(nextOperator)
  }

  return (
    <div className="twin-modal-backdrop" role="dialog" aria-modal="true">
      <section className="twin-modal twin-return-dialog">
        <header className="twin-modal-header">
          <div>
            <span>借用归还</span>
            <h3>{operator ? `${operator.empName} 的未归还记录` : '请先扫脸认证'}</h3>
          </div>
          <button type="button" className="twin-icon-button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        {!operator ? (
          <FaceGate onAuthenticated={handleAuthenticated} />
        ) : (
          <div className="twin-return-content">
            {loading ? (
              <div className="catalog-loading-state">
                <span className="terminal-loading-spinner" />
                <strong>正在查询未归还记录</strong>
              </div>
            ) : records.length === 0 ? (
              <div className="twin-empty-state">当前人员没有未归还借用记录。</div>
            ) : (
              <>
                <div className="twin-record-list">
                  {records.map(record => (
                    <button
                      type="button"
                      key={record.id}
                      className={String(record.id) === String(selected?.id) ? 'is-active' : ''}
                      onClick={() => setSelectedId(String(record.id))}
                    >
                      <strong>{record.itemName}</strong>
                      <span>未归还 {record.pendingQuantity} / {record.cabinetName || '柜体'} {record.slotNo ? `${record.slotNo}号格` : ''}</span>
                      <em>{formatDateTime(record.borrowTime)}</em>
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="twin-return-form">
                    <QuantityPicker
                      label="归还数量"
                      value={quantity}
                      max={selected.pendingQuantity || 1}
                      onChange={setQuantity}
                    />
                    <div className="twin-dialog-actions">
                      <button type="button" className="twin-secondary-action" onClick={onClose}>取消</button>
                      <button
                        type="button"
                        className="twin-primary-action"
                        disabled={operating}
                        onClick={() => onReturn(selected, quantity)}
                      >
                        {operating && <span className="terminal-button-spinner" />}
                        {operating ? '处理中...' : '确认归还并开门'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
})
