import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Keyboard, RefreshCw, ScanFace, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { FaceState, Operator } from '@/types/api'

const MAX_RECOGNITION_ATTEMPTS = 5
const RECOGNITION_INTERVAL_MS = 220
const WORK_NO_LENGTH = 8
const CAMERA_PREFERENCE_KEY = 'isd-web.camera.preference.v1'

interface CameraPreference {
  deviceId: string
  groupId?: string
  label?: string
  savedAt: string
}

function readCameraPreference(): CameraPreference | null {
  try {
    const raw = window.localStorage.getItem(CAMERA_PREFERENCE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CameraPreference
    return parsed?.deviceId ? parsed : null
  } catch {
    return null
  }
}

function saveCameraPreference(track: MediaStreamTrack) {
  const settings = track.getSettings()
  const deviceId = settings.deviceId
  if (!deviceId) return
  const preference: CameraPreference = {
    deviceId,
    groupId: settings.groupId,
    label: track.label,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CAMERA_PREFERENCE_KEY, JSON.stringify(preference))
}

async function getPreferredCameraConstraints(): Promise<MediaStreamConstraints> {
  const baseVideo = { width: { ideal: 960 }, height: { ideal: 720 } }
  const preference = readCameraPreference()
  if (!preference?.deviceId || !navigator.mediaDevices?.enumerateDevices) {
    return { video: { ...baseVideo, facingMode: 'user' } }
  }
  const devices = await navigator.mediaDevices.enumerateDevices()
  const matched = devices.some(
    device => device.kind === 'videoinput' && device.deviceId === preference.deviceId,
  )
  if (!matched) return { video: { ...baseVideo, facingMode: 'user' } }
  return { video: { ...baseVideo, deviceId: { exact: preference.deviceId } } }
}

interface FaceAuthProps {
  onAuthenticated: (operator: Operator) => void | Promise<void>
}

const STATUS_TEXT: Record<FaceState, string> = {
  idle: '等待开始认证',
  'camera-loading': '正在启动摄像头',
  camera: '摄像头已开启',
  recognizing: '正在识别操作人员',
  success: '认证通过',
  failed: '认证异常',
  unmatched: '未匹配到授权身份',
}

export const FaceAuth = memo(function FaceAuth({ onAuthenticated }: FaceAuthProps) {
  const [state, setState] = useState<FaceState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [manualVisible, setManualVisible] = useState(false)
  const [manualWorkNo, setManualWorkNo] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runRef = useRef(0)
  const hasStartedRef = useRef(false)

  const stopCamera = useCallback(() => {
    runRef.current += 1
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const waitForVideoReady = useCallback(async () => {
    const video = videoRef.current
    if (!video) return false
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) return true
    return new Promise<boolean>(resolve => {
      const timeout = window.setTimeout(() => { cleanup(); resolve(false) }, 3000)
      const onReady = () => { cleanup(); resolve(true) }
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
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.86).split(',')[1]
  }, [])

  const runRecognition = useCallback(async () => {
    const runId = runRef.current
    const ready = await waitForVideoReady()
    if (!ready || runId !== runRef.current) return

    setState('recognizing')
    try {
      for (let attempt = 0; attempt < MAX_RECOGNITION_ATTEMPTS; attempt += 1) {
        if (runId !== runRef.current) return
        if (attempt > 0) await new Promise(resolve => window.setTimeout(resolve, RECOGNITION_INTERVAL_MS))
        const base64 = captureFrame()
        if (!base64) continue
        const result = await api.recognizeFace(base64)
        if (runId !== runRef.current) return
        if (result?.empName && result?.empWorkNo) {
          setState('success')
          stopCamera()
          await onAuthenticated({ empName: result.empName, empWorkNo: result.empWorkNo })
          return
        }
      }
      stopCamera()
      setState('unmatched')
      setManualWorkNo('')
      setManualVisible(true)
    } catch {
      stopCamera()
      setErrorMsg('人脸识别服务异常，请重试。')
      setState('failed')
      setManualWorkNo('')
      setManualVisible(true)
    }
  }, [captureFrame, onAuthenticated, stopCamera, waitForVideoReady])

  const startCamera = useCallback(async () => {
    if (state === 'camera-loading' || state === 'camera' || state === 'recognizing') return
    runRef.current += 1
    setErrorMsg('')
    setManualVisible(false)
    setState('camera-loading')
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(await getPreferredCameraConstraints())
      } catch {
        window.localStorage.removeItem(CAMERA_PREFERENCE_KEY)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
        })
      }
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) saveCameraPreference(videoTrack)
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setState('camera')
      void runRecognition()
    } catch {
      setErrorMsg('无法访问摄像头，请检查浏览器权限。')
      setState('failed')
      setManualWorkNo('')
      setManualVisible(true)
    }
  }, [runRecognition, state])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    void startCamera()
  }, [startCamera])

  const showVideo = state === 'camera-loading' || state === 'camera' || state === 'recognizing'
  const canUseManualAuth = state === 'failed' || state === 'unmatched'

  const appendDigit = (digit: number) => {
    setManualWorkNo(current => `${current}${digit}`.slice(0, WORK_NO_LENGTH))
  }

  const submitManualAuth = async () => {
    const empWorkNo = manualWorkNo.trim()
    if (empWorkNo.length !== WORK_NO_LENGTH) {
      setErrorMsg(`请输入 ${WORK_NO_LENGTH} 位工号。`)
      setState('failed')
      return
    }
    setManualVisible(false)
    setState('success')
    await onAuthenticated({ empName: `工号${empWorkNo}`, empWorkNo })
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-lg border border-slate-300 bg-slate-100 shadow-inner">
        {showVideo ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ScanFace className="size-24" />
          </div>
        )}
        {(state === 'recognizing' || state === 'camera') && (
          <div className="absolute inset-x-6 top-1/2 h-1 animate-pulse rounded-full bg-teal-500 shadow-[0_0_18px] shadow-teal-400/70" />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-slate-950/80 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          <span className={`size-2.5 rounded-full ${state === 'recognizing' ? 'animate-pulse bg-amber-400' : state === 'success' ? 'bg-emerald-400' : 'bg-teal-400'}`} />
          {STATUS_TEXT[state]}
        </div>
      </div>

      <p className="text-center text-sm text-slate-500">
        {errorMsg && state === 'failed' ? errorMsg : '认证通过后，系统将继续执行开柜和业务记录。'}
      </p>

      {canUseManualAuth && (
        <div className="flex gap-2">
          <Button variant="default" size="lg" className="btn-shine" onClick={startCamera}>
            <RefreshCw />
            重新扫脸
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => { stopCamera(); setManualWorkNo(''); setManualVisible(true) }}
          >
            <Keyboard />
            输入工号
          </Button>
        </div>
      )}

      {state === 'idle' && (
        <Button size="lg" className="btn-shine" onClick={startCamera}>
          <Camera />
          开始认证
        </Button>
      )}

      {manualVisible && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg border bg-white p-5 text-slate-950 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-lg">输入工号</strong>
              <Button variant="ghost" size="icon" className="size-9" onClick={() => setManualVisible(false)} aria-label="关闭">
                <X className="size-5" />
              </Button>
            </div>
            <div className="mb-1 rounded-lg border bg-slate-50 px-3 py-3 text-center text-2xl font-black tabular-nums">
              {manualWorkNo || `请输入 ${WORK_NO_LENGTH} 位工号`}
            </div>
            <div className="mb-3 text-right text-xs text-slate-500">
              {manualWorkNo.length}/{WORK_NO_LENGTH}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(item => (
                <Button key={item} variant="outline" className="h-14 text-xl" onClick={() => appendDigit(item)}>
                  {item}
                </Button>
              ))}
              <Button variant="outline" className="h-14" onClick={() => setManualWorkNo('')}>清空</Button>
              <Button variant="outline" className="h-14 text-xl" onClick={() => appendDigit(0)}>0</Button>
              <Button variant="outline" className="h-14" onClick={() => setManualWorkNo(c => c.slice(0, -1))}>删除</Button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setManualVisible(false)}>取消</Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={manualWorkNo.trim().length !== WORK_NO_LENGTH}
                onClick={() => void submitManualAuth()}
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
