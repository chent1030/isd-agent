import React, { useRef, useEffect, useState } from 'react'

interface Props {
  onTranscribed: (text: string) => void
  onRecordingStart?: () => void
  disabled?: boolean
}

type RecordState = 'idle' | 'recording' | 'processing'

const labels = {
  micDenied: '\u65e0\u6cd5\u8bbf\u95ee\u9ea6\u514b\u98ce',
  noAudio: '\u672a\u68c0\u6d4b\u5230\u5f55\u97f3\u5185\u5bb9',
  noText: '\u672a\u8bc6\u522b\u5230\u8bed\u97f3\u5185\u5bb9',
  sttFailed: '\u8bed\u97f3\u8bc6\u522b\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
  idle: '\u6309\u4f4f\u8bf4\u8bdd',
  recording: '\u677e\u5f00\u53d1\u9001',
  processing: '\u8bc6\u522b\u4e2d',
  startTitle: '\u6309\u4f4f\u5f00\u59cb\u5f55\u97f3',
  stopTitle: '\u677e\u5f00\u7ed3\u675f\u5f55\u97f3',
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channelData = audioBuffer.getChannelData(0)
  let offset = 44
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return buffer
}

async function webmToWav(webmBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const ctx = new AudioContext()
  try {
    const decoded = await ctx.decodeAudioData(webmBuffer.slice(0))
    return encodeWav(decoded)
  } finally {
    await ctx.close()
  }
}

export default function VoiceInput({ onTranscribed, onRecordingStart, disabled }: Props) {
  const [state, setState] = useState<RecordState>('idle')
  const [volume, setVolume] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startPendingRef = useRef(false)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number>(0)
  const errorTimerRef = useRef<number | null>(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const stopVAD = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setVolume(0)
  }

  const showError = (message: string) => {
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current)
    setErrorMessage(message)
    errorTimerRef.current = window.setTimeout(() => {
      setErrorMessage('')
      errorTimerRef.current = null
    }, 3500)
  }

  const stopRecording = async () => {
    stopVAD()
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      stopStream()
      setState('idle')
      return
    }
    setState('processing')
    recorder.stop()
  }

  const startVAD = (stream: MediaStream) => {
    const ctx = new AudioContext()
    audioContextRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const check = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      setVolume(Math.min(rms * 8, 1))
      rafRef.current = requestAnimationFrame(check)
    }
    rafRef.current = requestAnimationFrame(check)
  }

  const startRecording = async () => {
    if (disabled || startPendingRef.current || state !== 'idle') return
    startPendingRef.current = true
    onRecordingStart?.()
    setErrorMessage('')
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stopStream()
        mediaRecorderRef.current = null
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (!blob.size) {
          showError(labels.noAudio)
          setState('idle')
          return
        }
        const webmBuffer = await blob.arrayBuffer()
        try {
          const wavBuffer = await webmToWav(webmBuffer)
          const result = await window.electronAPI.transcribeAudio(wavBuffer)
          const text = result?.text?.trim()
          if (text) {
            onTranscribed(text)
          } else {
            showError(labels.noText)
          }
        } catch (e) {
          console.error('STT error:', e)
          showError(labels.sttFailed)
        } finally {
          setState('idle')
        }
      }
      recorder.start(100)
      setState('recording')
      startVAD(stream)
    } catch (e) {
      console.error('Start recording error:', e)
      showError(labels.micDenied)
      stopVAD()
      stopStream()
      mediaRecorderRef.current = null
      setState('idle')
    } finally {
      startPendingRef.current = false
    }
  }

  const handlePressStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || state !== 'idle') return
    e.currentTarget.setPointerCapture(e.pointerId)
    void startRecording()
  }

  const handlePressEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (state === 'recording') void stopRecording()
  }

  useEffect(() => () => {
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current)
    stopVAD()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopStream()
  }, [])

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {errorMessage && (
        <div style={{
          position: 'absolute',
          bottom: 104,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          padding: '7px 12px',
          background: 'rgba(60,8,16,0.96)',
          border: '1px solid rgba(255,68,102,0.5)',
          color: '#ff9aad',
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 0 18px rgba(255,68,102,0.22)',
          pointerEvents: 'none',
        }}>
          {errorMessage}
        </div>
      )}
      <button
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
        onContextMenu={e => e.preventDefault()}
        disabled={disabled || isProcessing}
        title={isRecording ? labels.stopTitle : labels.startTitle}
        style={{
          position: 'relative',
          width: 92,
          height: 92,
          borderRadius: '50%',
          cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          background: isRecording
            ? 'radial-gradient(circle, rgba(255,68,102,0.35), rgba(90,8,24,0.96) 62%, #05080c 64%)'
            : 'radial-gradient(circle, rgba(0,212,255,0.28), rgba(0,65,92,0.92) 58%, #041018 62%)',
          border: `2px solid ${isRecording ? 'rgba(255,68,102,0.85)' : 'rgba(0,212,255,0.9)'}`,
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          color: isRecording ? '#ffffff' : 'var(--cyan)',
          transition: 'all 0.2s',
          opacity: disabled ? 0.4 : 1,
          overflow: 'hidden',
          boxShadow: isRecording
            ? '0 0 22px rgba(255,68,102,0.45), inset 0 0 24px rgba(255,255,255,0.08)'
            : '0 0 28px rgba(0,212,255,0.46), inset 0 0 28px rgba(0,212,255,0.18)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          userSelect: 'none',
          touchAction: 'none',
        }}>
        <div style={{
          position: 'absolute',
          inset: 6,
          borderRadius: '50%',
          border: `1px dashed ${isRecording ? 'rgba(255,255,255,0.45)' : 'rgba(0,212,255,0.5)'}`,
          animation: 'rotate-ring 8s linear infinite',
          pointerEvents: 'none',
        }} />
        {isRecording && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `rgba(255,255,255,${volume * 0.22})`,
            transition: 'background 0.1s',
            pointerEvents: 'none',
          }} />
        )}
        {isProcessing ? (
          <div style={{
            width: 22,
            height: 22,
            border: '2px solid rgba(0,212,255,0.2)',
            borderTop: '2px solid var(--cyan)',
            borderRadius: '50%',
            animation: 'rotate-ring 0.8s linear infinite',
          }} />
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 8px currentColor)' }}>
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 14.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93z" />
          </svg>
        )}
        <span style={{ position: 'relative', zIndex: 1, fontFamily: 'Rajdhani', textTransform: 'uppercase' }}>
          {isProcessing ? labels.processing : isRecording ? labels.recording : labels.idle}
        </span>
      </button>
    </div>
  )
}
