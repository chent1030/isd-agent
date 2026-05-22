import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import faceHologram from '../../assets/face-hologram.png'

type FaceAuthState = 'idle' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'

interface Props {
  onUnmatched: () => void
}

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
    <div className="auth-clock-block">
      <div className="lock-clock">{hh}:{mm}:{ss}</div>
      <div className="sci-subtitle" style={{ fontSize: 13, marginTop: 8 }}>{date}</div>
    </div>
  )
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.5 + 0.4,
        a: Math.random() * 0.8 + 0.2,
      })
    }

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,170,255,${p.a * 0.45})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

function FaceHologram({ state }: { state: FaceAuthState }) {
  const isScanning = state === 'recognizing'
  const isSuccess = state === 'success'
  const isFailed = state === 'failed' || state === 'unmatched'
  const color = isSuccess ? '#00ff88' : isFailed ? '#ff4466' : '#00d4ff'

  return (
    <div className="lock-face-ring">
      <div className="lock-face-radar" style={{ borderColor: `${color}66` }} />
      <div className="lock-face-radar reverse" style={{ borderColor: `${color}44` }} />
      <img className="face-hologram-img" src={faceHologram} alt="人脸识别全息图" />
      <div className="scan-corners lock-scan-corners"><span /><span /><span /><span /></div>
      {isScanning && <div className="lock-eye-scan" />}
    </div>
  )
}

export default function FaceAuth({ onUnmatched }: Props) {
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
    idle: '请将面部置于识别框内',
    camera: '摄像头已打开，准备识别',
    recognizing: '正在扫描身份信息',
    success: '身份认证通过',
    failed: errorMsg || '认证模块异常',
    unmatched: '未匹配到授权身份',
  }

  const showVideo = state === 'camera' || state === 'recognizing'

  return (
    <div className="sci-shell lock-shell">
      <ParticleCanvas />
      <section className="lock-window hud-frame">
        

        <div className="lock-content">
          <Clock />
          <div className="sci-title" style={{ color: 'var(--cyan)', fontSize: 18, marginTop: 18 }}>身份认证</div>

          {showVideo ? (
            <div className="lock-video-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(1.12) saturate(0.75)' }}
              />
              {state === 'recognizing' && <div className="lock-eye-scan" />}
              <div className="scan-corners lock-scan-corners"><span /><span /><span /><span /></div>
            </div>
          ) : (
            <FaceHologram state={state} />
          )}

          <div style={{ minHeight: 42, textAlign: 'center' }}>
            <div className="sci-title" style={{
              color: state === 'success' ? 'var(--green)' : state === 'failed' || state === 'unmatched' ? 'var(--amber)' : 'var(--cyan)',
              fontSize: 13,
            }}>
              {state === 'idle' ? '就绪' : state === 'camera' ? '摄像头已开启' : state === 'recognizing' ? '识别中' : state === 'success' ? '认证通过' : '需要处理'}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 8 }}>{statusText[state]}</div>
          </div>

          <div className="auth-action-row">
            {state === 'idle' && (
              <button type="button" onClick={startCamera} className="hud-button lock-primary">
                开始识别
              </button>
            )}
            {(state === 'unmatched' || state === 'failed') && (
              <>
                <button type="button" onClick={reset} className="hud-button lock-secondary">重新识别</button>
                <button type="button" onClick={onUnmatched} className="hud-button lock-secondary guest">访客进入</button>
              </>
            )}
            {state !== 'failed' && state !== 'unmatched' && (
              <button type="button" onClick={onUnmatched} className="hud-button lock-secondary guest">访客进入</button>
            )}
          </div>
        </div>

        <footer className="footer-strip lock-footer">
          <span>系统安全</span>
          <span>网络: <strong>在线</strong></span>
        </footer>
      </section>
    </div>
  )
}
