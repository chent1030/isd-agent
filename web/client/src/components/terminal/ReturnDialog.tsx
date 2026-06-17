import { memo, useEffect, useMemo, useState } from 'react'
import { Undo2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
      <DialogContent className="overflow-visible p-0 sm:max-w-2xl gap-0">
        <DialogHeader className="border-b px-6 py-4 mb-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">借用归还</Badge>
          </div>
          <DialogTitle>{operator ? `${operator.empName} 的未归还记录` : '请先扫脸认证'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col-reverse md:flex-row">
          {/* 左侧信息面板 */}
          <div className="flex flex-col justify-between md:w-80 md:border-r">
            <div className="flex-1 grow">
              <div className="border-t p-6 md:border-none">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                    <Undo2 className="size-5 text-foreground" aria-hidden />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-foreground">物品归还</h3>
                    <p className="text-sm text-muted-foreground">认证身份并选择归还记录</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <h4 className="text-sm font-medium text-foreground">归还流程</h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  1. 人脸认证身份<br />
                  2. 选择未归还记录<br />
                  3. 确认归还数量并开柜
                </p>
                {operator && (
                  <>
                    <h4 className="mt-6 text-sm font-medium text-foreground">当前操作人</h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {operator.empName}（工号 {operator.empWorkNo}）
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t p-4">
              <Button type="button" variant="ghost" disabled={operating} onClick={onClose}>
                取消
              </Button>
              {selected && operator && (
                <Button type="button" size="sm" disabled={operating} onClick={() => onReturn(selected, quantity)}>
                  {operating ? '处理中…' : '确认归还并开门'}
                </Button>
              )}
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 space-y-6 p-6 md:px-6 md:pb-8 md:pt-6 max-h-[70vh] overflow-y-auto">
            {!operator ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground">1</div>
                  <Label className="text-sm font-medium text-foreground">人脸认证</Label>
                </div>
                <FaceAuth onAuthenticated={handleAuthenticated} />
              </div>
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
              <>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground">2</div>
                    <Label className="text-sm font-medium text-foreground">选择未归还记录</Label>
                  </div>
                  <div className="space-y-2 mt-3">
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
                </div>

                {selected && (
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground">3</div>
                      <Label className="text-sm font-medium text-foreground">选择归还数量</Label>
                    </div>
                    <div className="mt-4">
                      <QuantityStepper
                        label="归还数量"
                        value={quantity}
                        max={selected.pendingQuantity || 1}
                        onChange={setQuantity}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
