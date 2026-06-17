import { memo, useEffect, useMemo, useState } from 'react'
import { Undo2, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

  // 当前步骤：0 未认证 / 1 选记录 / 2 选数量
  const step = !operator ? 0 : !selected ? 1 : 2

  return (
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            借用归还
          </span>
          <DialogTitle>
            {operator ? `${operator.empName} 的归还` : '物品归还'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 步骤指示器 */}
          <div className="flex items-center gap-2 text-sm">
            {[
              { n: 1, label: '认证' },
              { n: 2, label: '选记录' },
              { n: 3, label: '归还' },
            ].map((s, i, arr) => {
              const done = step > s.n - 1
              const active = step === s.n - 1
              return (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex size-7 items-center justify-center rounded-full font-semibold ${
                    active ? 'bg-slate-900 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={active ? 'font-semibold text-slate-900' : done ? 'text-slate-500' : 'text-slate-400'}>
                    {s.label}
                  </span>
                  {i < arr.length - 1 && <div className="h-px w-6 bg-slate-200" />}
                </div>
              )
            })}
          </div>

          {/* 步骤 1：人脸认证 */}
          {!operator && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                请先进行人脸认证，认证后自动查询您的未归还记录。
              </div>
              <FaceAuth onAuthenticated={handleAuthenticated} />
            </div>
          )}

          {/* 步骤 2：加载/选记录 */}
          {operator && loading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
              <p className="py-2 text-center text-sm text-slate-400">正在查询未归还记录…</p>
            </div>
          )}

          {operator && !loading && records.length === 0 && (
            <div className="flex h-32 items-center justify-center text-slate-400">
              当前人员没有未归还借用记录。
            </div>
          )}

          {operator && !loading && records.length > 0 && (
            <>
              {/* 记录列表 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">选择未归还记录</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {records.map(record => (
                    <button
                      type="button"
                      key={record.id}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        String(record.id) === String(selected?.id)
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedId(String(record.id))}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-900">{record.itemName}</strong>
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                          未归还 {record.pendingQuantity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.cabinetName || '柜体'} {record.slotNo ? `· ${record.slotNo}号格` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">借出：{formatDateTime(record.borrowTime)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 步骤 3：选数量 */}
              {selected && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900">归还数量</label>
                    <span className="text-xs text-slate-500">最大 {selected.pendingQuantity}</span>
                  </div>
                  <QuantityStepper
                    label="归还数量"
                    value={quantity}
                    max={selected.pendingQuantity || 1}
                    onChange={setQuantity}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={operating} onClick={onClose}>取消</Button>
          {selected && operator && (
            <Button disabled={operating} onClick={() => onReturn(selected, quantity)}>
              {operating ? '处理中…' : '确认归还并开门'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
