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
    <header className="terminal-header">
      <div className="terminal-header-brand">
        <div className="terminal-header-icon">
          <ShieldCheck className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="terminal-header-kicker">ISD 智能柜终端</p>
          <h1 className="terminal-header-title">物品领用与借还</h1>
        </div>
      </div>

      <div className="terminal-header-actions">
        <Button
          variant="secondary"
          size="xl"
          className="terminal-header-button terminal-header-button-light"
          disabled={refreshing}
          onClick={onRefresh}
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '同步中' : '刷新'}
        </Button>
        <Button
          variant="destructive"
          size="xl"
          className="terminal-header-button terminal-header-button-danger btn-shine"
          onClick={onReturn}
        >
          <RotateCcw />
          归还
        </Button>
        <div className="terminal-header-clock">
          <Clock />
        </div>
      </div>
    </header>
  )
}
