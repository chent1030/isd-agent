import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

type FaceAuthState = 'idle' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'

const MAX_RECOGNITION_ATTEMPTS = 5
const RECOGNITION_INTERVAL_MS = 200

function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const ss = time.getSeconds().toString().padStart(2, '0')
  const date = time.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="login-clock">
      <div className="login-clock-time">{hh}:{mm}:{ss}</div>
      <div className="login-clock-date">{date}</div>
    </div>
  )
}

function FacePreview({ state }: { state: FaceAuthState }) {
  return (
    <div className={`login-face-preview login-face-${state}`} role="img" aria-label="身份识别状态">
      <div className="login-face-ring" />
      <div className="login-face-ring login-face-ring-inner" />
      <div className="login-identity-visual" aria-hidden="true">
        <span className="login-orbit-line" />
        <span className="login-orbit-dot login-orbit-dot-top" />
        <span className="login-orbit-dot login-orbit-dot-right" />
        <span className="login-orbit-dot login-orbit-dot-bottom" />
        <span className="login-orbit-dot login-orbit-dot-left" />
        <span className="login-identity-core">
          <span className="login-core-mark" />
        </span>
      </div>
      <span className="login-scan-line" />
    </div>
  )
}

export default function FaceAuth() {
  const [state, setState] = useState<FaceAuthState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanRunRef = useRef(0)
  const login = useAuthStore(s => s.login)

  const stopCamera = useCallback(() => {
    scanRunRef.current += 1
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const waitForVideoReady = useCallback(async () => {
    const video = videoRef.current
    if (!video) return false
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) return true

    return new Promise<boolean>(resolve => {
      const timeout = window.setTimeout(() => {
        cleanup()
        resolve(false)
      }, 3000)
      const onReady = () => {
        cleanup()
        resolve(true)
      }
      const cleanup = () => {
        window.clearTimeout(timeout)
        video.removeEventListener('loadedmetadata', onReady)
        video.removeEventListener('canplay', onReady)
      }
      video.addEventListener('loadedmetadata', onReady)
      video.addEventListener('canplay', onReady)
    })
  }, [])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.86).split(',')[1]
  }, [])

  const runAutoRecognition = useCallback(async () => {
    const runId = scanRunRef.current
    const ready = await waitForVideoReady()
    if (!ready || runId !== scanRunRef.current) return

    setState('recognizing')
    try {
      for (let attempt = 0; attempt < MAX_RECOGNITION_ATTEMPTS; attempt += 1) {
        if (runId !== scanRunRef.current) return
        if (attempt > 0) await new Promise(resolve => window.setTimeout(resolve, RECOGNITION_INTERVAL_MS))
        const base64 = captureFrame()
        if (!base64) continue
        const result = await window.electronAPI.recognizeFace(base64)
        if (runId !== scanRunRef.current) return
        if (result?.empName && result?.empWorkNo) {
          setState('success')
          stopCamera()
          login({ empName: result.empName, empWorkNo: result.empWorkNo })
          return
        }
      }
      stopCamera()
      setState('unmatched')
    } catch {
      stopCamera()
      setErrorMsg('人脸识别服务异常，请重试')
      setState('failed')
    }
  }, [captureFrame, login, stopCamera, waitForVideoReady])

  const startCamera = useCallback(async () => {
    scanRunRef.current += 1
    setErrorMsg('')
    setState('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      void runAutoRecognition()
    } catch {
      setErrorMsg('无法访问摄像头，请检查权限')
      setState('failed')
    }
  }, [runAutoRecognition])

  useEffect(() => () => stopCamera(), [stopCamera])

  const reset = () => {
    stopCamera()
    setState('idle')
    setErrorMsg('')
  }

  const statusText: Record<FaceAuthState, string> = {
    idle: '请将面部置于识别区域内',
    camera: '摄像头已开启，准备识别',
    recognizing: '正在扫描身份信息',
    success: '身份认证通过',
    failed: errorMsg || '认证模块异常',
    unmatched: '未匹配到授权身份，请重新识别',
  }

  const stateLabel: Record<FaceAuthState, string> = {
    idle: '等待认证',
    camera: '摄像头已开启',
    recognizing: '识别中',
    success: '认证通过',
    failed: '认证异常',
    unmatched: '认证未通过',
  }

  const showVideo = state === 'camera' || state === 'recognizing'
  const canStart = state === 'idle'
  const canRetry = state === 'unmatched' || state === 'failed'

  return (
    <div className="login-shell">
      <section className="login-card" aria-label="身份认证">
        <div className="login-brand-panel">
          <div className="login-brand">行小助</div>
          <h1>身份认证</h1>
          <p>完成认证后进入行小助物品领用。</p>
          <Clock />
        </div>

        <div className="login-auth-panel">
          <div className="login-status-pill">{stateLabel[state]}</div>

          {showVideo ? (
            <div className={`login-video-frame ${state === 'recognizing' ? 'is-scanning' : ''}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <span className="login-scan-line" />
            </div>
          ) : (
            <FacePreview state={state} />
          )}

          <div className="login-status-copy">
            <strong>{stateLabel[state]}</strong>
            <span>{statusText[state]}</span>
          </div>

          <div className="login-actions">
            {canStart && (
              <button type="button" onClick={startCamera} className="login-primary-button">
                开始识别
              </button>
            )}
            {canRetry && (
              <button type="button" onClick={reset} className="login-secondary-button">
                重新识别
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
