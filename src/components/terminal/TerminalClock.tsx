import { memo, useEffect, useState } from 'react'

export const TerminalClock = memo(function TerminalClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="twin-clock">
      <strong>{now.toLocaleTimeString('zh-CN', { hour12: false })}</strong>
      <span>{now.toLocaleDateString('zh-CN')}</span>
    </div>
  )
})
