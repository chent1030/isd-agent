import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

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
    <div className="text-center select-none">
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 88, fontWeight: 300, letterSpacing: '0.12em', lineHeight: 1 }}
        className="text-gradient">
        {hh}<span style={{ opacity: 0.4, animation: 'blink-cursor 1s step-end infinite' }}>:</span>{mm}
        <span style={{ fontSize: 32, opacity: 0.5, marginLeft: 8, verticalAlign: 'middle' }}>{ss}</span>
      </div>
      <div style={{ fontFamily: 'Noto Sans SC', fontSize: 13, letterSpacing: '0.2em', marginTop: 8 }}
        className="text-gradient">{date}</div>
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
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random(),
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
        ctx.fillStyle = `rgba(0,212,255,${p.a * 0.4})`
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,212,255,${(1 - dist / 120) * 0.08})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
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

function FaceRing({ state }: { state: FaceAuthState }) {
  const isScanning = state === 'recognizing'
  const isSuccess = state === 'success'
  const isFailed = state === 'failed' || state === 'unmatched'
  const color = isSuccess ? '#00ff88' : isFailed ? '#ff4466' : '#00d4ff'

  return (
    <div style={{ position: 'relative', width: 240, height: 240 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `1px solid ${color}33`,
        animation: 'rotate-ring 8s linear infinite',
      }}>
        <div style={{
          position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
          width: 6, height: 6, borderRadius: '50%', background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
      <div style={{
        position: 'absolute', inset: 16, borderRadius: '50%',
        border: `1px dashed ${color}22`,
        animation: 'rotate-ring-rev 12s linear infinite',
      }} />
      {isScanning && [0, 0.5, 1].map(delay => (
        <div key={delay} style={{
          position: 'absolute', inset: 28, borderRadius: '50%',
          border: `1px solid ${color}`,
          animation: `pulse-ring 2s ease-out ${delay}s infinite`,
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 28, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {isScanning && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: 'face-scan 1.5s ease-in-out infinite',
            boxShadow: `0 0 8px ${color}`,
          }} />
        )}
        {isSuccess ? (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : isFailed ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="#ff4466" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              fill={`${color}66`} />
          </svg>
        )}
      </div>
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
        if (attempt > 0) {
          await new Promise(resolve => window.setTimeout(resolve, RECOGNITION_INTERVAL_MS))
        }

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
      setErrorMsg('识别服务异常，请稍后重试')
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      void runAutoRecognition()
    } catch {
      setErrorMsg('无法打开摄像头')
      setState('failed')
    }
  }, [runAutoRecognition])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const reset = () => {
    stopCamera()
    setState('idle')
    setErrorMsg('')
  }

  const statusText: Record<FaceAuthState, string> = {
    idle: '请打开摄像头进行身份识别',
    camera: '摄像头已打开，准备识别',
    recognizing: '正在自动识别...',
    success: '识别成功',
    failed: errorMsg || '识别失败',
    unmatched: '未匹配到授权人员',
  }

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--surface)' }}>
      <ParticleCanvas />

      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <Clock />

        {(state === 'camera' || state === 'recognizing') && (
          <div style={{
            position: 'relative',
            width: 'min(72vw, 720px)',
            aspectRatio: '4 / 3',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(0,212,255,0.3)',
            boxShadow: '0 0 40px rgba(0,212,255,0.18)',
          }} className="animate-fade-scale">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {state === 'recognizing' && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                  boxShadow: '0 0 12px #00d4ff',
                  animation: 'face-scan 1.2s ease-in-out infinite',
                }} />
              </div>
            )}
            {['tl', 'tr', 'bl', 'br'].map(pos => (
              <div key={pos} style={{
                position: 'absolute',
                top: pos.startsWith('t') ? 14 : 'auto',
                bottom: pos.startsWith('b') ? 14 : 'auto',
                left: pos.endsWith('l') ? 14 : 'auto',
                right: pos.endsWith('r') ? 14 : 'auto',
                width: 30,
                height: 30,
                borderTop: pos.startsWith('t') ? '2px solid #00d4ff' : 'none',
                borderBottom: pos.startsWith('b') ? '2px solid #00d4ff' : 'none',
                borderLeft: pos.endsWith('l') ? '2px solid #00d4ff' : 'none',
                borderRight: pos.endsWith('r') ? '2px solid #00d4ff' : 'none',
              }} />
            ))}
          </div>
        )}

        {state !== 'camera' && state !== 'recognizing' && (
          <div className="animate-fade-scale">
            <FaceRing state={state} />
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani', fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase' }}
            className={state === 'success' ? 'text-gradient' : state === 'failed' || state === 'unmatched' ? '' : 'text-gradient'}>
            <span style={{ color: state === 'failed' ? 'var(--red)' : state === 'unmatched' ? 'var(--amber)' : undefined }}>
              {statusText[state]}
            </span>
          </div>
          {state === 'recognizing' && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, letterSpacing: '0.1em' }}>
              每 200ms 采样一次，最多识别 5 次
            </div>
          )}
          {state === 'unmatched' && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, letterSpacing: '0.1em' }}>
              请调整面部位置后重试，或使用游客模式
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {state === 'idle' && (
            <button onClick={startCamera} className="btn-primary"
              style={{ padding: '12px 40px', borderRadius: 4, fontSize: 13 }}>
              打开摄像头
            </button>
          )}
          {(state === 'unmatched' || state === 'failed') && (
            <>
              <button onClick={reset} className="btn-primary"
                style={{ padding: '12px 40px', borderRadius: 4, fontSize: 13 }}>
                重新识别
              </button>
              <button onClick={onUnmatched} className="btn-ghost"
                style={{ padding: '10px 40px', borderRadius: 4, fontSize: 12 }}>
                进入游客模式
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }} />
    </div>
  )
}
