import { memo, useEffect, useState } from 'react'
import { toast } from '@/components/ui/toast'
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
  const operationLabel = mode === 'receive' ? '����' : '����'
  const canProceed = quantity > 0 && quantity <= maxQuantity && !operating && (mode === 'receive' ? canReceiveItem : canBorrowItem)

  const proceedToFace = () => {
    if (item.cabinetQuantity <= 0) {
      setError('���ڿ����������㣬����ϵ����Ա����')
      return
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`��ѡ�� 1 �� ${maxQuantity} ֮�������`)
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
            <Badge variant="secondary">{item.category || 'δ����'}</Badge>
            {item.authRequired && <Badge variant="warning">����Ȩ</Badge>}
          </div>
          <DialogTitle className="text-2xl">{item.name}</DialogTitle>
          <DialogDescription>{item.spec || '�޹��'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          {/* ��Ʒ��Ϣ */}
          <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <div>
              <div className="text-xs text-muted-foreground">���������</div>
              <div className="text-3xl font-extrabold text-foreground">{item.cabinetQuantity}</div>
            </div>
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground">���</div>
              <div className="text-sm font-medium">{item.spec || '--'}</div>
            </div>
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground">��Ȩ</div>
              <div className={`text-sm font-medium ${item.authRequired ? 'text-amber-600' : ''}`}>
                {item.authRequired ? '��Ҫ��Ȩ' : '������Ȩ'}
              </div>
            </div>
          </div>

          {/* ������ */}
          <div className="space-y-4">
            {step === 'quantity' ? (
              <>
                {canSwitchMode && (
                  <Tabs value={mode} onValueChange={v => setMode(v as OperationMode)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="receive" disabled={!canReceiveItem}>����</TabsTrigger>
                      <TabsTrigger value="borrow" disabled={!canBorrowItem}>����</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                <QuantityStepper label="ѡ������" value={quantity} max={maxQuantity} onChange={setQuantity} />
              </>
            ) : (
              <FaceAuth onAuthenticated={handleAuthenticated} />
            )}

            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</div>}

            <div className="flex flex-wrap justify-end gap-2">
              {step === 'face' && (
                <Button variant="outline" disabled={operating} onClick={() => setStep('quantity')}>
                  �����޸�����
                </Button>
              )}
              <Button variant="ghost" disabled={operating} onClick={onClose}>ȡ��</Button>
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
