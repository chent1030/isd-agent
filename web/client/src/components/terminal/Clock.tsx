import { memo, useEffect, useState } from 'react'

export const Clock = memo(function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="text-right tabular-nums leading-tight">
      <div className="text-2xl font-semibold text-foreground">
        {now.toLocaleTimeString('zh-CN', { hour12: false })}
      </div>
      <div className="text-xs text-muted-foreground">{now.toLocaleDateString('zh-CN')}</div>
    </div>
  )
})
