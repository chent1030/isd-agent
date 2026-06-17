import { memo, useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuantityStepper } from './QuantityStepper'
import { FaceAuth } from './FaceAuth'
import type { CabinetCatalogItem, OperationMode, Operator } from '@/types/api'

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

  // 快速选择数量选项
  const quantityOptions = maxQuantity <= 20
    ? Array.from({ length: maxQuantity }, (_, i) => i + 1)
    : [1, 2, 3, 5, 10]

  return (
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent className="overflow-visible p-0 sm:max-w-2xl gap-0">
        <DialogHeader className="border-b px-6 py-4 mb-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.category || '未分类'}</Badge>
            {item.authRequired && <Badge variant="warning">需授权</Badge>}
          </div>
          <DialogTitle className="text-2xl">{item.name}</DialogTitle>
          <DialogDescription>{item.spec || '无规格'}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse md:flex-row">
          {/* 左侧信息面板 */}
          <div className="flex flex-col justify-between md:w-80 md:border-r">
            <div className="flex-1 grow">
              <div className="border-t p-6 md:border-none">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                    <Package className="size-5 text-foreground" aria-hidden />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-foreground">物品领用</h3>
                    <p className="text-sm text-muted-foreground">选择数量并认证身份</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <h4 className="text-sm font-medium text-foreground">物品信息</h4>
                <div className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>格口内数量</span>
                    <span className="text-2xl font-extrabold text-foreground">{item.cabinetQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>规格</span>
                    <span className="font-medium text-foreground">{item.spec || '--'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>授权要求</span>
                    <span className={`font-medium ${item.authRequired ? 'text-amber-600' : 'text-foreground'}`}>
                      {item.authRequired ? '需要授权' : '无需授权'}
                    </span>
                  </div>
                </div>
                <h4 className="mt-6 text-sm font-medium text-foreground">操作提示</h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  选择数量与方式后，将进行人脸认证并自动开柜。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t p-4">
              <Button type="button" variant="ghost" disabled={operating} onClick={onClose}>
                取消
              </Button>
              {step === 'quantity' && (
                <Button type="button" size="sm" disabled={!canProceed} onClick={proceedToFace}>
                  {operationLabel}
                </Button>
              )}
              {step === 'face' && (
                <Button type="button" size="sm" variant="outline" disabled={operating} onClick={() => setStep('quantity')}>
                  返回修改数量
                </Button>
              )}
            </div>
          </div>

          {/* 右侧分步选择区 */}
          <div className="flex-1 space-y-6 p-6 md:px-6 md:pb-8 md:pt-6">
            {step === 'quantity' ? (
              <>
                {canSwitchMode && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground">1</div>
                      <Label className="text-sm font-medium text-foreground">选择操作方式</Label>
                    </div>
                    <Select value={mode} onValueChange={v => setMode(v as OperationMode)}>
                      <SelectTrigger id="mode" className="w-full">
                        <SelectValue placeholder="选择方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receive" disabled={!canReceiveItem}>领用</SelectItem>
                        <SelectItem value="borrow" disabled={!canBorrowItem}>借用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-3">
                    <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground">
                      {canSwitchMode ? 2 : 1}
                    </div>
                    <Label className="text-sm font-medium text-foreground">选择数量</Label>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">当前最多可领 {maxQuantity} 件。</p>
                  <div className="mt-4">
                    <QuantityStepper label="数量" value={quantity} max={maxQuantity} onChange={setQuantity} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">快速选择：</span>
                    {quantityOptions.map(q => (
                      <Button
                        key={q}
                        type="button"
                        variant={quantity === q ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-10"
                        onClick={() => setQuantity(Math.min(Math.max(q, 1), maxQuantity))}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex size-6 items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground">
                    ✓
                  </div>
                  <Label className="text-sm font-medium text-foreground">人脸认证</Label>
                </div>
                <FaceAuth onAuthenticated={handleAuthenticated} />
              </div>
            )}

            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
