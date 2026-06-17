import { memo, useEffect, useState } from 'react'
import { Package, Check } from 'lucide-react'
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
      setError('柜内可领数量不足，请联系管理员补货')
      return
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`请选择 1 到 ${maxQuantity} 之间的数量`)
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
      <DialogContent>
        {/* 标题区 */}
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {item.category || '未分类'}
            </span>
            {item.authRequired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                需授权
              </span>
            )}
          </div>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.spec || '无规格'}</DialogDescription>
        </DialogHeader>

        {/* 内容区：单栏，纵向步骤 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 步骤指示器 */}
          <div className="flex items-center gap-3 text-sm">
            <div className={`flex size-7 items-center justify-center rounded-full font-semibold ${
              step === 'configure' ? 'bg-slate-900 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {step === 'configure' ? '1' : <Check className="h-4 w-4" />}
            </div>
            <span className={step === 'configure' ? 'font-semibold text-slate-900' : 'text-slate-400'}>
              配置领用信息
            </span>
            <div className="h-px flex-1 bg-slate-200" />
            <div className={`flex size-7 items-center justify-center rounded-full font-semibold ${
              step === 'auth' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              2
            </div>
            <span className={step === 'auth' ? 'font-semibold text-slate-900' : 'text-slate-400'}>
              人脸认证
            </span>
          </div>

          {step === 'configure' && (
            <>
              {/* 物品摘要卡片 */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">格口内</div>
                    <div className="text-xl font-bold text-slate-900">{item.cabinetQuantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">规格</div>
                    <div className="font-medium text-slate-700 truncate">{item.spec || '--'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">授权</div>
                    <div className={`font-medium ${item.authRequired ? 'text-amber-600' : 'text-slate-700'}`}>
                      {item.authRequired ? '需要授权' : '无需授权'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 方式选择 */}
              {canSwitchMode && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">操作方式</label>
                  <Select value={mode} onValueChange={v => setMode(v as OperationMode)}>
                    <SelectTrigger id="mode" className="w-full bg-white">
                      <SelectValue placeholder="选择方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receive" disabled={!canReceiveItem}>领用</SelectItem>
                      <SelectItem value="borrow" disabled={!canBorrowItem}>借用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 数量选择 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-900">选择数量</label>
                  <span className="text-xs text-slate-500">最大 {maxQuantity}</span>
                </div>
                <QuantityStepper label="数量" value={quantity} max={maxQuantity} onChange={setQuantity} />
              </div>
            </>
          )}

          {step === 'auth' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                确认信息：{operationLabel} <strong className="text-slate-900">{item.name}</strong> × <strong className="text-slate-900">{quantity}</strong>
              </div>
              <FaceAuth onAuthenticated={handleAuthenticated} />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</div>
          )}
        </div>

        {/* 底部操作栏 */}
        <DialogFooter>
          {step === 'auth' && (
            <Button variant="outline" disabled={operating} onClick={() => setStep('configure')}>
              返回上一步
            </Button>
          )}
          <Button variant="ghost" disabled={operating} onClick={onClose}>取消</Button>
          {step === 'configure' && (
            <Button className="btn-shine" disabled={!canProceed} onClick={proceedToAuth}>
              下一步：人脸认证
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
