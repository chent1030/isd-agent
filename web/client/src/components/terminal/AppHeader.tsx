import { RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Clock } from './Clock'

interface AppHeaderProps {
  refreshing: boolean
  onRefresh: () => void
  onReturn: () => void
}

export function AppHeader({ refreshing, onRefresh, onReturn }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-5 rounded-lg bg-slate-950 px-5 py-4 text-white shadow-xl shadow-slate-950/10">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-teal-500 text-white">
          <ShieldCheck className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-teal-100">ISD 智能柜终端</p>
          <h1 className="truncate text-2xl font-bold tracking-normal">物品领用与借还</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Button variant="secondary" size="xl" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '同步中' : '刷新'}
        </Button>
        <Button variant="destructive" size="xl" className="btn-shine" onClick={onReturn}>
          <RotateCcw />
          归还
        </Button>
        <div className="rounded-md border border-white/10 bg-white/8 px-4 py-2">
          <Clock />
        </div>
      </div>
    </header>
  )
}
