import { memo, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, PackageCheck, RotateCcw, ScanFace } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  return (
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[1120px] border-0 p-0">
        <DialogHeader
          className="border-b-0 px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, #ecfeff 0%, #f0f9ff 58%, #fff7ed 100%)',
            color: '#0f172a',
            boxShadow: 'inset 0 -1px 0 rgba(20,184,166,0.16)',
          }}
        >
          <div className="flex items-center gap-2 pr-10">
            <span
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-black"
              style={{ backgroundColor: 'rgba(255,255,255,0.78)', color: '#0f766e', boxShadow: 'inset 0 0 0 1px rgba(20,184,166,0.18)' }}
            >
              <RotateCcw className="size-4" />
              借用归还
            </span>
            {operator && (
              <span
                className="rounded-md px-3 py-1.5 text-sm font-bold"
                style={{ backgroundColor: '#e7f6ef', color: '#07543f' }}
              >
                {operator.empName}
              </span>
            )}
          </div>
          <DialogTitle className="pr-10 text-3xl" style={{ color: '#0f172a' }}>
            {operator ? '选择未归还记录' : '归还物品'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-5" style={{ backgroundColor: '#eefbff', color: '#0f172a' }}>
          <div className="grid h-full min-h-[520px] grid-cols-[340px_minmax(0,1fr)] gap-5">
            <aside
              className="relative overflow-hidden rounded-lg p-5 shadow-sm"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              <div
                className="absolute inset-x-0 top-0 h-24"
                style={{ background: 'linear-gradient(180deg, rgba(20,184,166,0.18), rgba(20,184,166,0))' }}
              />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#4b6475' }}>身份认证</div>
                    <div className="mt-1 text-xl font-black text-slate-950">
                      {operator ? operator.empName : '请进行人脸认证'}
                    </div>
                  </div>
                  <div
                    className="flex size-12 items-center justify-center rounded-lg"
                    style={operator
                      ? { background: 'linear-gradient(145deg, #14b8a6, #0d9488)', color: '#ffffff' }
                      : { backgroundColor: '#dff7f2', color: '#0f766e' }}
                  >
                    {operator ? <Check className="size-7" strokeWidth={3} /> : <ScanFace className="size-7" />}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {operator ? (
                    <div
                      className="flex h-full flex-col justify-between rounded-lg p-5"
                      style={{
                        background: 'linear-gradient(155deg, #ffffff 0%, #ecfeff 58%, #f0fdfa 100%)',
                        color: '#0f172a',
                        boxShadow: '0 18px 38px rgba(15,118,110,0.10), inset 0 1px 0 rgba(255,255,255,0.96)',
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: '#0f766e' }}>待归还记录</div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-7xl font-black tabular-nums">{records.length}</span>
                          <span className="text-lg font-bold" style={{ color: '#0f766e' }}>条</span>
                        </div>
                      </div>
                      <div className="rounded-md px-4 py-3 text-sm font-bold" style={{ backgroundColor: '#dff7f2', color: '#0f766e' }}>
                        {selected ? `当前选中：${selected.itemName}` : loading ? '正在查询记录' : '暂无待归还记录'}
                      </div>
                    </div>
                  ) : (
                    <FaceAuth onAuthenticated={handleAuthenticated} />
                  )}
                </div>
              </div>
            </aside>

            <section
              className="flex min-h-0 flex-col overflow-hidden rounded-lg shadow-sm"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              {operator && loading && (
                <div className="flex-1 space-y-3 overflow-hidden p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              )}

              {operator && !loading && records.length === 0 && (
                <div className="flex flex-1 items-center justify-center p-6">
                  <div className="flex w-full max-w-md flex-col items-center rounded-lg p-8 text-center" style={{ backgroundColor: '#f8fafc' }}>
                    <PackageCheck className="mb-4 size-16 text-emerald-700" />
                    <div className="text-2xl font-black text-slate-950">没有未归还记录</div>
                  </div>
                </div>
              )}

              {operator && !loading && records.length > 0 && (
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px] gap-0">
                  <div className="min-h-0 overflow-y-auto p-5">
                    <div className="grid gap-3">
                      {records.map(record => {
                        const active = String(record.id) === String(selected?.id)
                        return (
                          <button
                            type="button"
                            key={record.id}
                            className="w-full rounded-lg p-4 text-left shadow-sm transition active:scale-[0.99]"
                            style={active
                              ? { backgroundColor: '#ecfeff', color: '#0f172a', boxShadow: 'inset 0 0 0 2px #14b8a6, 0 10px 24px rgba(20,184,166,0.14)' }
                              : { backgroundColor: '#f8fafc', color: '#0f172a', boxShadow: 'inset 0 0 0 1px #dbe4ea' }}
                            onClick={() => setSelectedId(String(record.id))}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <strong className="line-clamp-2 text-xl font-black leading-tight">{record.itemName}</strong>
                              <span
                                className="shrink-0 rounded-md px-3 py-1.5 text-base font-black"
                                style={{ backgroundColor: active ? '#14b8a6' : '#fb7185', color: '#ffffff' }}
                              >
                                待还 {record.pendingQuantity}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold" style={{ color: '#4b6475' }}>
                              <span>{record.cabinetName || '柜体'}</span>
                              {record.slotNo ? <span>{record.slotNo} 号格</span> : null}
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="size-4" />
                                {formatDateTime(record.borrowTime)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {selected && (
                    <div className="border-l border-slate-200 p-5" style={{ backgroundColor: '#f4f8fb' }}>
                      <div className="flex h-full flex-col gap-4">
                        <div
                          className="rounded-lg p-5"
                          style={{
                            background: 'linear-gradient(155deg, #ffffff 0%, #ecfeff 58%, #f0fdfa 100%)',
                            color: '#0f172a',
                            boxShadow: '0 18px 38px rgba(15,118,110,0.10), inset 0 1px 0 rgba(255,255,255,0.96)',
                          }}
                        >
                          <div className="text-sm font-semibold" style={{ color: '#0f766e' }}>归还物品</div>
                          <div className="mt-2 line-clamp-3 text-2xl font-black leading-tight">{selected.itemName}</div>
                          <div className="mt-5 flex items-end justify-between">
                            <div>
                              <div className="text-sm font-semibold" style={{ color: '#0f766e' }}>待归还</div>
                              <div className="mt-1 text-6xl font-black tabular-nums">{selected.pendingQuantity}</div>
                            </div>
                            <span className="pb-2 text-lg font-bold" style={{ color: '#0f766e' }}>件</span>
                          </div>
                        </div>

                        <QuantityStepper
                          label="归还数量"
                          value={quantity}
                          max={selected.pendingQuantity || 1}
                          onChange={setQuantity}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="border-t-0 px-6 py-4" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          <Button variant="ghost" size="xl" disabled={operating} onClick={onClose}>取消</Button>
          {selected && operator && (
            <Button
              size="xl"
              className="btn-shine"
              disabled={operating}
              style={{ background: 'linear-gradient(145deg, #14b8a6, #0d9488)', borderColor: '#0d9488', color: '#ffffff' }}
              onClick={() => onReturn(selected, quantity)}
            >
              {operating ? '处理中...' : '确认归还'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
