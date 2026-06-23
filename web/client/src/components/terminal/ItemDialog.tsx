import { memo, useEffect, useState } from 'react'
import { Check, Package, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
        <DialogHeader className="border-b-0 bg-slate-950 text-white">
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-100">
              {item.category || '未分类'}
            </span>
            {item.authRequired && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-black"
                style={{ backgroundColor: '#b91c1c', color: '#ffffff' }}
              >
                <ShieldCheck className="size-3.5" />
                需授权
              </span>
            )}
          </div>
          <DialogTitle className="text-white">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50 px-6 py-5">
          <div className="flex items-center justify-between rounded-2xl bg-white/85 p-4 shadow-sm">
            <StepBadge active={step === 'configure'} done={step === 'auth'} index={1} label="确认信息" />
            <div className="mx-4 h-px flex-1 bg-slate-200" />
            <StepBadge active={step === 'auth'} done={false} index={2} label="身份认证" />
          </div>

          {step === 'configure' && (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
                <div className="absolute -right-8 -top-8 size-32 rounded-full bg-teal-400/20" />
                <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-white/12">
                      <Package className="size-8" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-300">当前物品</div>
                      <div className="mt-1 line-clamp-2 text-2xl font-black">{item.name}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-300">柜内库存</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-7xl font-black tabular-nums">{item.cabinetQuantity}</span>
                      <span className="text-lg font-bold text-slate-300">件</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white/90 p-5 shadow-sm">
                <div className="space-y-5">
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
                </div>
              </section>
            </div>
          )}

          {step === 'auth' && (
            <div className="space-y-4 rounded-2xl bg-white/90 p-5 shadow-sm">
              <div className="rounded-xl bg-teal-50 p-4 text-base text-teal-900">
                请确认：{operationLabel} <strong>{item.name}</strong> x <strong>{quantity}</strong>
              </div>
              <FaceAuth onAuthenticated={handleAuthenticated} />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
          )}
        </div>

        <DialogFooter className="border-t-0 bg-white">
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
