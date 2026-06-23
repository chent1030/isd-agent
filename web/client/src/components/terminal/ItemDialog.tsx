import { memo, useEffect, useState } from 'react'
import { Check, Package, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  const [step, setStep] = useState<'configure' | 'auth'>('configure')
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(item.useType === 1 ? 'borrow' : 'receive')
    setQuantity(1)
    setStep('configure')
    setError('')
  }, [item])

  const maxQuantity = Math.max(item.cabinetQuantity, 1)
  const canReceiveItem = item.cabinetQuantity > 0 && item.useType !== 1
  const canBorrowItem = item.cabinetQuantity > 0 && (item.useType === 1 || item.useType === 2)
  const canSwitchMode = item.useType === 2
  const operationLabel = mode === 'receive' ? '领用' : '借用'
  const canProceed = quantity > 0 && quantity <= maxQuantity && !operating && (mode === 'receive' ? canReceiveItem : canBorrowItem)

  const proceedToAuth = () => {
    if (item.cabinetQuantity <= 0) {
      setError('柜内可用数量不足，请联系管理员补货。')
      return
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`请选择 1 到 ${maxQuantity} 之间的数量。`)
      return
    }
    setError('')
    setStep('auth')
  }

  const handleAuthenticated = async (operator: Operator) => {
    setError('')
    await onOperate(item, mode, quantity, operator)
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !operating) onClose() }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
              {item.category || '未分类'}
            </span>
            {item.authRequired && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                <ShieldCheck className="size-3.5" />
                需授权
              </span>
            )}
          </div>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.spec || '暂无规格信息'}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <StepBadge active={step === 'configure'} done={step === 'auth'} index={1} label="确认信息" />
            <div className="h-px bg-slate-200" />
            <StepBadge active={step === 'auth'} done={false} index={2} label="身份认证" />
          </div>

          {step === 'configure' && (
            <>
              <div className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex size-14 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Package className="size-7" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Metric label="柜内库存" value={String(item.cabinetQuantity)} />
                  <Metric label="规格" value={item.spec || '--'} />
                  <Metric label="授权" value={item.authRequired ? '需要' : '无需'} tone={item.authRequired ? 'warning' : 'default'} />
                </div>
              </div>

              {canSwitchMode && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">操作方式</label>
                  <Select value={mode} onValueChange={v => setMode(v as OperationMode)}>
                    <SelectTrigger id="mode" className="h-12 w-full bg-white text-base">
                      <SelectValue placeholder="选择方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receive" disabled={!canReceiveItem}>领用</SelectItem>
                      <SelectItem value="borrow" disabled={!canBorrowItem}>借用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <QuantityStepper label={`${operationLabel}数量`} value={quantity} max={maxQuantity} onChange={setQuantity} />
            </>
          )}

          {step === 'auth' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-base text-teal-900">
                请确认：{operationLabel} <strong>{item.name}</strong> x <strong>{quantity}</strong>
              </div>
              <FaceAuth onAuthenticated={handleAuthenticated} />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
          )}
        </div>

        <DialogFooter>
          {step === 'auth' && (
            <Button variant="outline" size="lg" disabled={operating} onClick={() => setStep('configure')}>
              返回上一步
            </Button>
          )}
          <Button variant="ghost" size="lg" disabled={operating} onClick={onClose}>取消</Button>
          {step === 'configure' && (
            <Button size="lg" className="btn-shine" disabled={!canProceed} onClick={proceedToAuth}>
              下一步：人脸认证
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

function StepBadge({ active, done, index, label }: { active: boolean; done: boolean; index: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
        done ? 'bg-emerald-600 text-white' : active ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-500'
      }`}>
        {done ? <Check className="size-4" /> : index}
      </div>
      <span className={active ? 'font-bold text-slate-950' : 'font-medium text-slate-500'}>{label}</span>
    </div>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' }) {
  return (
    <div className="min-w-0 rounded-md bg-white px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 truncate text-lg font-black ${tone === 'warning' ? 'text-amber-700' : 'text-slate-950'}`}>{value}</div>
    </div>
  )
}
