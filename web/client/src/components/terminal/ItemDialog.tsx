import { memo, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  return (
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.category || '未分类'}</Badge>
            {item.authRequired && <Badge variant="warning">需授权</Badge>}
          </div>
          <DialogTitle className="text-2xl">{item.name}</DialogTitle>
          <DialogDescription>{item.spec || '无规格'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          {/* 物品信息 */}
          <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <div>
              <div className="text-xs text-muted-foreground">格口内数量</div>
              <div className="text-3xl font-extrabold text-foreground">{item.cabinetQuantity}</div>
            </div>
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground">规格</div>
              <div className="text-sm font-medium">{item.spec || '--'}</div>
            </div>
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground">授权</div>
              <div className={`text-sm font-medium ${item.authRequired ? 'text-amber-600' : ''}`}>
                {item.authRequired ? '需要授权' : '无需授权'}
              </div>
            </div>
          </div>

          {/* 操作区 */}
          <div className="space-y-4">
            {step === 'quantity' ? (
              <>
                {canSwitchMode && (
                  <Tabs value={mode} onValueChange={v => setMode(v as OperationMode)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="receive" disabled={!canReceiveItem}>领用</TabsTrigger>
                      <TabsTrigger value="borrow" disabled={!canBorrowItem}>借用</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                <QuantityStepper label="选择数量" value={quantity} max={maxQuantity} onChange={setQuantity} />
              </>
            ) : (
              <FaceAuth onAuthenticated={handleAuthenticated} />
            )}

            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</div>}

            <div className="flex flex-wrap justify-end gap-2">
              {step === 'face' && (
                <Button variant="outline" disabled={operating} onClick={() => setStep('quantity')}>
                  返回修改数量
                </Button>
              )}
              <Button variant="ghost" disabled={operating} onClick={onClose}>取消</Button>
              {step === 'quantity' && (
                <Button disabled={!canProceed} onClick={proceedToFace}>
                  {operationLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
