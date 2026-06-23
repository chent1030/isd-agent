import { Fragment, memo, useEffect, useMemo, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
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

  const step = !operator ? 0 : !selected ? 1 : 2

  return (
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <span className="inline-flex w-fit items-center gap-1 rounded-md bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
            <RotateCcw className="size-3.5" />
            借用归还
          </span>
          <DialogTitle>{operator ? `${operator.empName} 的归还记录` : '物品归还'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
            {[
              { n: 1, label: '身份认证' },
              { n: 2, label: '选择记录' },
              { n: 3, label: '确认归还' },
            ].map((s, index) => {
              const done = step > s.n - 1
              const active = step === s.n - 1
              return (
                <Fragment key={s.n}>
                  <div key={s.n} className="flex items-center gap-2">
                    <div className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
                      done ? 'bg-emerald-600 text-white' : active ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {done ? <Check className="size-4" /> : s.n}
                    </div>
                    <span className={active ? 'font-bold text-slate-950' : 'font-medium text-slate-500'}>{s.label}</span>
                  </div>
                  {index < 2 && <div key={`line-${s.n}`} className="h-px bg-slate-200" />}
                </Fragment>
              )
            })}
          </div>

          {!operator && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-base text-slate-600">
                请先完成人脸认证。认证通过后，系统会自动查询当前人员的未归还借用记录。
              </div>
              <FaceAuth onAuthenticated={handleAuthenticated} />
            </div>
          )}

          {operator && loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
              <p className="py-2 text-center text-sm text-slate-500">正在查询未归还记录...</p>
            </div>
          )}

          {operator && !loading && records.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-base font-medium text-slate-500">
              当前人员没有未归还借用记录。
            </div>
          )}

          {operator && !loading && records.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">选择未归还记录</label>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {records.map(record => (
                    <button
                      type="button"
                      key={record.id}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        String(record.id) === String(selected?.id)
                          ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedId(String(record.id))}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="line-clamp-1 text-lg text-slate-950">{record.itemName}</strong>
                        <span className="shrink-0 rounded-md bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-700">
                          未归还 {record.pendingQuantity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {record.cabinetName || '柜体'} {record.slotNo ? `· ${record.slotNo} 号格` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">借出：{formatDateTime(record.borrowTime)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selected && (
                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="text-sm font-medium text-slate-500">待归还物品</div>
                    <div className="mt-1 text-2xl font-black text-slate-950">{selected.itemName}</div>
                  </div>
                  <QuantityStepper
                    label="归还数量"
                    value={quantity}
                    max={selected.pendingQuantity || 1}
                    onChange={setQuantity}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="lg" disabled={operating} onClick={onClose}>取消</Button>
          {selected && operator && (
            <Button size="lg" className="btn-shine" disabled={operating} onClick={() => onReturn(selected, quantity)}>
              {operating ? '处理中...' : '确认归还并开柜'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
