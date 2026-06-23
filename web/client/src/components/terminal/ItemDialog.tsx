import { memo, useEffect, useState } from 'react'
import { Package, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[1100px] border-0 p-0">
        <DialogHeader className="border-b-0 px-6 py-4" style={{ backgroundColor: '#111827', color: '#ffffff' }}>
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <span
              className="rounded-md px-2.5 py-1 text-xs font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#f8fafc' }}
            >
              {item.category || '未分类'}
            </span>
            {item.authRequired && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-black"
                style={{
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)',
                }}
              >
                <ShieldCheck className="size-3.5" />
                需授权
              </span>
            )}
          </div>
          <DialogTitle className="line-clamp-1 pr-10 text-3xl" style={{ color: '#ffffff' }}>
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-5" style={{ backgroundColor: '#e8eef2', color: '#0f172a' }}>
          {step === 'configure' && (
            <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)] gap-5">
              <section
                className="relative overflow-hidden rounded-lg p-5 shadow-sm"
                style={{ backgroundColor: '#10233a', color: '#ffffff' }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 h-28"
                  style={{ background: 'linear-gradient(180deg, rgba(20,184,166,0), rgba(20,184,166,0.18))' }}
                />
                <div className="relative z-10 flex h-full min-h-[390px] flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-16 items-center justify-center rounded-lg"
                      style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff' }}
                    >
                      <Package className="size-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: '#b6c5d6' }}>当前物品</div>
                      <div className="mt-1 line-clamp-3 text-2xl font-black leading-tight" style={{ color: '#ffffff' }}>
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#b6c5d6' }}>柜内库存</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-7xl font-black tabular-nums" style={{ color: '#ffffff' }}>
                        {item.cabinetQuantity}
                      </span>
                      <span className="text-lg font-bold" style={{ color: '#b6c5d6' }}>件</span>
                    </div>
                  </div>
                </div>
              </section>

              <section
                className="flex min-h-0 flex-col rounded-lg p-5 shadow-sm"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <div className="min-h-0 flex-1 space-y-4">
                  {canSwitchMode && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg p-1.5" style={{ backgroundColor: '#eef3f6' }}>
                      <button
                        type="button"
                        disabled={!canReceiveItem}
                        className="h-12 rounded-md text-base font-black transition disabled:cursor-not-allowed disabled:opacity-45"
                        style={mode === 'receive'
                          ? { backgroundColor: '#111827', color: '#ffffff' }
                          : { backgroundColor: '#ffffff', color: '#334155' }}
                        onClick={() => setMode('receive')}
                      >
                        领用
                      </button>
                      <button
                        type="button"
                        disabled={!canBorrowItem}
                        className="h-12 rounded-md text-base font-black transition disabled:cursor-not-allowed disabled:opacity-45"
                        style={mode === 'borrow'
                          ? { backgroundColor: '#111827', color: '#ffffff' }
                          : { backgroundColor: '#ffffff', color: '#334155' }}
                        onClick={() => setMode('borrow')}
                      >
                        借用
                      </button>
                    </div>
                  )}

                  <QuantityStepper label={`${operationLabel}数量`} value={quantity} max={maxQuantity} onChange={setQuantity} />
                </div>
              </section>
            </div>
          )}

          {step === 'auth' && (
            <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)] gap-5">
              <section className="rounded-lg p-5 shadow-sm" style={{ backgroundColor: '#10233a', color: '#ffffff' }}>
                <div className="flex h-full min-h-[360px] flex-col justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#b6c5d6' }}>{operationLabel}物品</div>
                    <div className="mt-2 line-clamp-4 text-2xl font-black leading-tight">{item.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#b6c5d6' }}>{operationLabel}数量</div>
                    <div className="mt-2 text-7xl font-black tabular-nums">{quantity}</div>
                  </div>
                </div>
              </section>
              <div
                className="min-h-0 overflow-y-auto rounded-lg p-5 shadow-sm"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <div className="mb-4 rounded-md px-4 py-3 text-base font-bold" style={{ backgroundColor: '#e7f6ef', color: '#07543f' }}>
                  请完成身份认证，认证通过后自动执行{operationLabel}。
                </div>
                <FaceAuth onAuthenticated={handleAuthenticated} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md px-3 py-2 text-sm font-semibold" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="border-t-0 px-6 py-4" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          {step === 'auth' && (
            <Button variant="outline" size="xl" disabled={operating} onClick={() => setStep('configure')}>
              返回修改数量
            </Button>
          )}
          <Button variant="ghost" size="xl" disabled={operating} onClick={onClose}>取消</Button>
          {step === 'configure' && (
            <Button
              size="xl"
              className="btn-shine"
              disabled={!canProceed}
              style={canProceed
                ? { backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#ffffff' }
                : { backgroundColor: '#cbd5e1', borderColor: '#cbd5e1', color: '#64748b' }}
              onClick={proceedToAuth}
            >
              {operationLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
