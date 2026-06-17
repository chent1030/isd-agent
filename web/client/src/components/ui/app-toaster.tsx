'use client'

import { useEffect, useRef } from 'react'
import Toaster, { type ToasterRef, registerToaster } from '@/components/ui/toast'

/**
 * 应用级 Toaster：挂载后自动注册到全局适配器，
 * 业务代码 import { toast } from '@/components/ui/toast' 即可用命令式 API。
 */
export function AppToaster() {
  const ref = useRef<ToasterRef>(null)

  useEffect(() => {
    registerToaster(ref.current)
    return () => registerToaster(null)
  }, [])

  return <Toaster ref={ref} defaultPosition="top-center" />
}
