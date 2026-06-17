import { RefreshCw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Clock } from './Clock'

interface AppHeaderProps {
  refreshing: boolean
  onRefresh: () => void
  onReturn: () => void
}

export function AppHeader({ refreshing, onRefresh, onReturn }: AppHeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 rounded-xl border bg-card/80 px-5 py-3 shadow-sm backdrop-blur">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">行小助</p>
        <h1 className="text-xl font-bold text-foreground">物品领用终端</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="lg" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '同步中' : '刷新'}
        </Button>
        <Button variant="destructive" size="lg" onClick={onReturn}>
          <Undo2 />
          归还
        </Button>
        <Clock />
      </div>
    </header>
  )
}
