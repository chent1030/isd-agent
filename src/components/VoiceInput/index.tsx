import React, { useRef, useEffect, useState } from 'react'

interface Props {
  onTranscribed: (text: string) => void
  disabled?: boolean
}

type RecordState = 'idle' | 'recording' | 'processing'

const SILENCE_THRESHOLD = 0.01
const SILENCE_DURATION = 1500

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
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
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

export default function VoiceInput({ onTranscribed, disabled }: Props) {
  const [state, setState] = useState<RecordState>('idle')
  const [volume, setVolume] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startPendingRef = useRef(false)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number>(0)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const stopVAD = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setVolume(0)
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
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v }
      const rms = Math.sqrt(sum / data.length)
      setVolume(Math.min(rms * 8, 1))
      if (rms < SILENCE_THRESHOLD) {
        if (!silenceTimerRef.current) silenceTimerRef.current = setTimeout(() => stopRecording(), SILENCE_DURATION)
      } else {
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      }
      rafRef.current = requestAnimationFrame(check)
    }
    rafRef.current = requestAnimationFrame(check)
  }

  const startRecording = async () => {
    if (disabled || startPendingRef.current || state !== 'idle') return
    startPendingRef.current = true
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
          setState('idle')
          return
        }
        const webmBuffer = await blob.arrayBuffer()
        try {
          const wavBuffer = await webmToWav(webmBuffer)
          const result = await window.electronAPI.transcribeAudio(wavBuffer)
          if (result?.text) onTranscribed(result.text)
        } catch (e) {
          console.error('STT error:', e)
        } finally {
          setState('idle')
        }
      }
      recorder.start(100)
      setState('recording')
      startVAD(stream)
    } catch (e) {
      console.error('Start recording error:', e)
      stopVAD()
      stopStream()
      mediaRecorderRef.current = null
      setState('idle')
    } finally {
      startPendingRef.current = false
    }
  }

  const handleClick = () => {
    if (state === 'idle') startRecording()
    else if (state === 'recording') stopRecording()
  }

  useEffect(() => () => {
    stopVAD()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    stopStream()
  }, [])

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      title={isRecording ? '点击停止录音' : '点击开始录音'}
      style={{
        position: 'relative',
        width: 34, height: 34, borderRadius: 6,
        cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
        background: isRecording
          ? 'rgba(255,68,102,0.15)'
          : 'transparent',
        border: `1px solid ${isRecording ? 'rgba(255,68,102,0.4)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isRecording ? 'var(--red)' : isProcessing ? 'var(--text-muted)' : 'var(--text-dim)',
        transition: 'all 0.2s',
        opacity: disabled ? 0.4 : 1,
        overflow: 'hidden',
      }}>
      {/* 音量波纹 */}
      {isRecording && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 6,
          background: `rgba(255,68,102,${volume * 0.15})`,
          transition: 'background 0.1s',
          pointerEvents: 'none',
        }} />
      )}
      {isProcessing ? (
        <div style={{
          width: 12, height: 12,
          border: '1.5px solid var(--border-bright)', borderTop: '1.5px solid var(--cyan)',
          borderRadius: '50%', animation: 'rotate-ring 0.8s linear infinite',
        }} />
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 14.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93z" />
        </svg>
      )}
    </button>
  )
}
