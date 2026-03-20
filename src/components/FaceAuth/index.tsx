import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

type FaceAuthState = 'idle' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'

interface Props {
  onUnmatched: () => void
}

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
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '88px', fontWeight: 300, letterSpacing: '0.12em', lineHeight: 1 }}
        className="text-gradient">
        {hh}<span style={{ opacity: 0.4, animation: 'blink-cursor 1s step-end infinite' }}>:</span>{mm}
        <span style={{ fontSize: '32px', opacity: 0.5, marginLeft: '8px', verticalAlign: 'middle' }}>{ss}</span>
      </div>
      <div style={{ fontFamily: 'Noto Sans SC', fontSize: '13px', letterSpacing: '0.2em', marginTop: '8px' }}
        className="text-gradient" >{date}</div>
    </div>
  )
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
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
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,212,255,${p.a * 0.4})`
        ctx.fill()
      })
      // draw connections
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
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

function FaceRing({ state }: { state: FaceAuthState }) {
  const isScanning = state === 'recognizing'
  const isSuccess = state === 'success'
  const isFailed = state === 'failed' || state === 'unmatched'
  const color = isSuccess ? '#00ff88' : isFailed ? '#ff4466' : '#00d4ff'

  return (
    <div style={{ position: 'relative', width: 220, height: 220 }}>
      {/* outer ring */}
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
      {/* middle ring */}
      <div style={{
        position: 'absolute', inset: 16, borderRadius: '50%',
        border: `1px dashed ${color}22`,
        animation: 'rotate-ring-rev 12s linear infinite',
      }} />
      {/* pulse rings */}
      {isScanning && [0, 0.5, 1].map(delay => (
        <div key={delay} style={{
          position: 'absolute', inset: 28, borderRadius: '50%',
          border: `1px solid ${color}`,
          animation: `pulse-ring 2s ease-out ${delay}s infinite`,
        }} />
      ))}
      {/* inner circle */}
      <div style={{
        position: 'absolute', inset: 28, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)`,
        border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* scan line */}
        {isScanning && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: 'face-scan 1.5s ease-in-out infinite',
            boxShadow: `0 0 8px ${color}`,
          }} />
        )}
        {/* icon */}
        {isSuccess ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: 'float-up 0.4s ease forwards' }} />
          </svg>
        ) : isFailed ? (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="#ff4466" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
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
  const login = useAuthStore(s => s.login)

  const startCamera = useCallback(async () => {
    setState('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setErrorMsg('无法访问摄像头')
      setState('failed')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const capture = useCallback(async () => {
    if (!videoRef.current) return
    setState('recognizing')
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1]
    stopCamera()
    try {
      const result = await window.electronAPI.recognizeFace(base64)
      if (result?.empName && result?.empWorkNo) {
        setState('success')
        login({ empName: result.empName, empWorkNo: result.empWorkNo })
      } else {
        setState('unmatched')
      }
    } catch {
      setErrorMsg('识别服务异常，请重试')
      setState('failed')
    }
  }, [login, stopCamera])

  const reset = () => { setState('idle'); setErrorMsg('') }

  const statusText: Record<FaceAuthState, string> = {
    idle: '点击开始人脸识别',
    camera: '请正视摄像头',
    recognizing: '正在识别...',
    success: '身份验证成功',
    failed: errorMsg || '识别失败',
    unmatched: '未找到匹配用户',
  }

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--surface)' }}>
      <ParticleCanvas />

      {/* 背景光晕 */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        {/* 时钟 */}
        <Clock />

        {/* 摄像头预览（camera 状态） */}
        {(state === 'camera' || state === 'recognizing') && (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 0 30px rgba(0,212,255,0.15)' }}
            className="animate-fade-scale">
            <video ref={videoRef} autoPlay muted style={{ width: 280, height: 210, objectFit: 'cover', display: 'block' }} />
            {state === 'recognizing' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,14,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '2px solid rgba(0,212,255,0.2)', borderTop: '2px solid #00d4ff', borderRadius: '50%', animation: 'rotate-ring 0.8s linear infinite' }} />
              </div>
            )}
            {/* 角标 */}
            {['tl','tr','bl','br'].map(pos => (
              <div key={pos} style={{
                position: 'absolute',
                top: pos.startsWith('t') ? 8 : 'auto',
                bottom: pos.startsWith('b') ? 8 : 'auto',
                left: pos.endsWith('l') ? 8 : 'auto',
                right: pos.endsWith('r') ? 8 : 'auto',
                width: 16, height: 16,
                borderTop: pos.startsWith('t') ? '2px solid #00d4ff' : 'none',
                borderBottom: pos.startsWith('b') ? '2px solid #00d4ff' : 'none',
                borderLeft: pos.endsWith('l') ? '2px solid #00d4ff' : 'none',
                borderRight: pos.endsWith('r') ? '2px solid #00d4ff' : 'none',
              }} />
            ))}
          </div>
        )}

        {/* 人脸环形图标（非摄像头状态） */}
        {state !== 'camera' && state !== 'recognizing' && (
          <div className="animate-fade-scale">
            <FaceRing state={state} />
          </div>
        )}

        {/* 状态文字 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani', fontSize: 15, letterSpacing: '0.25em', textTransform: 'uppercase' }}
            className={state === 'success' ? 'text-gradient' : state === 'failed' || state === 'unmatched' ? '' : 'text-gradient'}>
            <span style={{ color: state === 'failed' ? 'var(--red)' : state === 'unmatched' ? 'var(--amber)' : undefined }}>
              {statusText[state]}
            </span>
          </div>
          {state === 'unmatched' && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.1em' }}>
              可以访客身份进入问答模式
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {state === 'idle' && (
            <button onClick={startCamera} className="btn-primary"
              style={{ padding: '12px 40px', borderRadius: 4, fontSize: 13 }}>
              ▶ 开始识别
            </button>
          )}
          {state === 'camera' && (
            <button onClick={capture} className="btn-primary"
              style={{ padding: '12px 40px', borderRadius: 4, fontSize: 13 }}>
              ◉ 拍照识别
            </button>
          )}
          {(state === 'unmatched' || state === 'failed') && (
            <>
              <button onClick={reset} className="btn-primary"
                style={{ padding: '12px 40px', borderRadius: 4, fontSize: 13 }}>
                ↺ 重新识别
              </button>
              <button onClick={onUnmatched} className="btn-ghost"
                style={{ padding: '10px 40px', borderRadius: 4, fontSize: 12 }}>
                以访客身份进入
              </button>
            </>
          )}
        </div>
      </div>

      {/* 底部装饰线 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }} />
    </div>
  )
}
