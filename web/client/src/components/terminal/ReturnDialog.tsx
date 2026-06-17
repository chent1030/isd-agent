import { memo, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FaceAuth } from './FaceAuth'
import { QuantityStepper } from './QuantityStepper'
import { formatDateTime } from '@/lib/shared'
import type { BorrowRecord, Operator } from '@/types/api'

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
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">借用归还</Badge>
          </div>
          <DialogTitle>{operator ? `${operator.empName} 的未归还记录` : '请先扫脸认证'}</DialogTitle>
        </DialogHeader>

        {!operator ? (
          <FaceAuth onAuthenticated={handleAuthenticated} />
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
            <p className="py-2 text-center text-sm text-muted-foreground">正在查询未归还记录…</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            当前人员没有未归还借用记录。
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {records.map(record => (
                <button
                  type="button"
                  key={record.id}
                  className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-all hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none ${
                    String(record.id) === String(selected?.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border'
                  }`}
                  onClick={() => setSelectedId(String(record.id))}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-foreground">{record.itemName}</strong>
                    <Badge variant="warning">未归还 {record.pendingQuantity}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.cabinetName || '柜体'} {record.slotNo ? `${record.slotNo}号格` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">借出：{formatDateTime(record.borrowTime)}</p>
                </button>
              ))}
            </div>

            {selected && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <QuantityStepper
                  label="归还数量"
                  value={quantity}
                  max={selected.pendingQuantity || 1}
                  onChange={setQuantity}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" disabled={operating} onClick={onClose}>取消</Button>
                  <Button disabled={operating} onClick={() => onReturn(selected, quantity)}>
                    {operating ? '处理中…' : '确认归还并开门'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})
