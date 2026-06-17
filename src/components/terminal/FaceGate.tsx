import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { FaceState, Operator } from '../../types/terminal'

const FACE_CAPTURE_COUNT = 5
const FACE_CAPTURE_INTERVAL_MS = 1000
const CAMERA_READY_TIMEOUT_MS = 8000
const CAMERA_READY_POLL_MS = 100
const CAMERA_STABLE_FRAME_COUNT = 2
const WORK_NO_LENGTH = 8
const CAMERA_PREFERENCE_KEY = 'isd-agent.camera.preference.v1'

const logFaceStep = (message: string, details?: Record<string, unknown>) => {
  console.info(`[FaceGate] ${message}`, details || '')
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number
}

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
  const matched = devices.some(device => device.kind === 'videoinput' && device.deviceId === preference.deviceId)
  if (!matched) return { video: { ...baseVideo, facingMode: 'user' } }
  return { video: { ...baseVideo, deviceId: { exact: preference.deviceId } } }
}

interface FaceGateProps {
  onAuthenticated: (operator: Operator) => void | Promise<void>
}

function pickMostFrequentOperator(results: Array<Operator | null>) {
  const counts = new Map<string, { operator: Operator; count: number; firstIndex: number }>()

  results.forEach((operator, index) => {
    if (!operator?.empName || !operator?.empWorkNo) return
    const key = `${operator.empWorkNo}|${operator.empName}`
    const current = counts.get(key)
    counts.set(key, {
      operator,
      count: (current?.count || 0) + 1,
      firstIndex: current?.firstIndex ?? index,
    })
  })

  return Array.from(counts.values()).sort((left, right) => (
    right.count - left.count || left.firstIndex - right.firstIndex
  ))[0]?.operator || null
}

function delay(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms))
}

function isVideoElementReady(video: HTMLVideoElement) {
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
}

function getVideoFrameStats(video: HTMLVideoElement) {
  if (!isVideoElementReady(video)) return null
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  try {
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let total = 0
    const luminance: number[] = []
    for (let index = 0; index < pixels.length; index += 4) {
      const value = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
      luminance.push(value)
      total += value
    }
    const average = total / luminance.length
    const variance = luminance.reduce((sum, value) => sum + ((value - average) ** 2), 0) / luminance.length
    return { average, variance }
  } catch {
    return null
  }
}

async function waitForNextVideoFrame(video: HTMLVideoElement) {
  const videoWithCallback = video as VideoWithFrameCallback
  if (typeof videoWithCallback.requestVideoFrameCallback === 'function') {
    await Promise.race([
      new Promise<void>(resolve => videoWithCallback.requestVideoFrameCallback?.(() => resolve())),
      delay(500),
    ])
    return
  }

  await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
}

export const FaceGate = memo(function FaceGate({
  onAuthenticated,
}: FaceGateProps) {
  const [state, setState] = useState<FaceState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [manualVisible, setManualVisible] = useState(false)
  const [manualWorkNo, setManualWorkNo] = useState('')
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runRef = useRef(0)
  const hasStartedRef = useRef(false)

  const stopCamera = useCallback(() => {
    runRef.current += 1
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setVideoReady(false)
  }, [])

  const waitForVideoReady = useCallback(async (runId: number) => {
    const video = videoRef.current
    if (!video) return false
    const startedAt = Date.now()
    try {
      await video.play()
    } catch {
      // Some Chromium builds reject play() transiently while the stream is attaching.
    }

    while (Date.now() - startedAt < CAMERA_READY_TIMEOUT_MS) {
      if (runId !== runRef.current) return false
      if (isVideoElementReady(video)) return true
      await Promise.race([
        new Promise<void>(resolve => {
          const onReady = () => {
            cleanup()
            resolve()
          }
          const cleanup = () => {
            window.clearTimeout(timeout)
            video.removeEventListener('loadedmetadata', onReady)
            video.removeEventListener('canplay', onReady)
            video.removeEventListener('playing', onReady)
          }
          const timeout = window.setTimeout(() => {
            cleanup()
            resolve()
          }, CAMERA_READY_POLL_MS)
          video.addEventListener('loadedmetadata', onReady)
          video.addEventListener('canplay', onReady)
          video.addEventListener('playing', onReady)
        }),
        delay(CAMERA_READY_POLL_MS),
      ])
    }

    return false
  }, [])

  const waitForUsableCameraFrame = useCallback(async (runId: number) => {
    const video = videoRef.current
    if (!video) return false
    const startedAt = Date.now()
    let stableFrames = 0

    while (Date.now() - startedAt < CAMERA_READY_TIMEOUT_MS) {
      if (runId !== runRef.current) return false
      if (!isVideoElementReady(video)) {
        stableFrames = 0
        await delay(CAMERA_READY_POLL_MS)
        continue
      }

      await waitForNextVideoFrame(video)
      if (runId !== runRef.current) return false

      const stats = getVideoFrameStats(video)
      if (stats && stats.average > 3 && stats.variance > 0.5) {
        stableFrames += 1
        if (stableFrames >= CAMERA_STABLE_FRAME_COUNT) return true
      } else {
        stableFrames = 0
      }

      await delay(CAMERA_READY_POLL_MS)
    }

    return false
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

  const captureFrames = useCallback(async (runId: number) => {
    const frames: string[] = []
    for (let index = 0; index < FACE_CAPTURE_COUNT; index += 1) {
      if (runId !== runRef.current) return frames
      await delay(FACE_CAPTURE_INTERVAL_MS)
      if (runId !== runRef.current) return frames
      const frame = captureFrame()
      if (frame) frames.push(frame)
    }
    return frames
  }, [captureFrame])

  const runRecognition = useCallback(async (runId: number) => {
    logFaceStep('recognition started', { runId, intervalMs: FACE_CAPTURE_INTERVAL_MS, count: FACE_CAPTURE_COUNT })
    setVideoReady(true)
    setState('recognizing')
    try {
      const frames = await captureFrames(runId)
      if (frames.length === 0) {
        throw new Error('No camera frame captured')
      }
      logFaceStep('frames captured', { runId, count: frames.length })
      const results: Array<Operator | null> = []
      let requestCompleted = false
      for (const frame of frames) {
        if (runId !== runRef.current) return
        let result: { empName: string; empWorkNo: string } | null = null
        try {
          result = await window.electronAPI.recognizeFace(frame)
          requestCompleted = true
        } catch (error) {
          console.warn('Face recognition failed for one frame, continuing with next frame.', error)
        }
        if (runId !== runRef.current) return
        results.push(result?.empName && result?.empWorkNo ? { empName: result.empName, empWorkNo: result.empWorkNo } : null)
      }
      if (frames.length > 0 && !requestCompleted) {
        throw new Error('All face recognition requests failed')
      }
      const operator = pickMostFrequentOperator(results)
      if (operator) {
        logFaceStep('recognition matched', { runId, empWorkNo: operator.empWorkNo })
        setState('success')
        stopCamera()
        await onAuthenticated(operator)
        return
      }
      stopCamera()
      logFaceStep('recognition unmatched', { runId })
      setState('unmatched')
      setManualWorkNo('')
      setManualVisible(true)
    } catch (error) {
      stopCamera()
      console.warn('[FaceGate] recognition failed', error)
      setErrorMsg('人脸识别服务异常，请重试')
      setState('failed')
      setManualWorkNo('')
      setManualVisible(true)
    }
  }, [captureFrames, onAuthenticated, stopCamera, waitForUsableCameraFrame, waitForVideoReady])

  const startCamera = useCallback(async () => {
    if (state === 'camera-loading' || state === 'camera' || state === 'recognizing') return
    runRef.current += 1
    setErrorMsg('')
    setManualVisible(false)
    setVideoReady(false)
    setState('camera-loading')
    try {
      const runId = runRef.current
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(await getPreferredCameraConstraints())
      } catch (error) {
        window.localStorage.removeItem(CAMERA_PREFERENCE_KEY)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
        })
      }
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) saveCameraPreference(videoTrack)
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      logFaceStep('camera stream attached', { runId, label: videoTrack?.label || '' })
      const ready = await waitForVideoReady(runId)
      const usable = ready && await waitForUsableCameraFrame(runId)
      if (!usable || runId !== runRef.current) {
        stopCamera()
        setErrorMsg('摄像头画面加载失败，请重试')
        setState('failed')
        setManualWorkNo('')
        setManualVisible(true)
        return
      }
      logFaceStep('camera frame usable', { runId })
      setVideoReady(true)
      setState('camera')
      void runRecognition(runId)
    } catch {
      setErrorMsg('无法访问摄像头，请检查权限')
      setState('failed')
      setManualWorkNo('')
      setManualVisible(true)
    }
  }, [runRecognition, state, stopCamera, waitForUsableCameraFrame, waitForVideoReady])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    void startCamera()
  }, [startCamera])

  const statusText = {
    idle: '点击开始后进行身份认证',
    'camera-loading': '正在唤起摄像头',
    camera: '摄像头已开启',
    recognizing: '正在识别操作人',
    success: '认证通过',
    failed: errorMsg || '认证异常',
    unmatched: '未匹配到授权身份',
  }[state]

  const showVideo = state === 'camera-loading' || state === 'camera' || state === 'recognizing'
  const showCameraLoading = state === 'camera-loading' || (showVideo && !videoReady)
  const canUseManualAuth = state === 'failed' || state === 'unmatched'
  const appendManualDigit = (digit: number) => {
    setManualWorkNo(current => `${current}${digit}`.slice(0, WORK_NO_LENGTH))
  }
  const submitManualAuth = async () => {
    const empWorkNo = manualWorkNo.trim()
    if (empWorkNo.length !== WORK_NO_LENGTH) {
      setErrorMsg(`请输入${WORK_NO_LENGTH}位工号`)
      setState('failed')
      return
    }
    setManualVisible(false)
    setState('success')
    await onAuthenticated({ empName: `工号${empWorkNo}`, empWorkNo })
  }

  return (
    <div className="twin-face-gate">
      <div className={`twin-face-preview twin-face-${state}`}>
        <video ref={videoRef} className={showVideo && videoReady ? '' : 'is-waiting'} autoPlay playsInline muted />
        {showCameraLoading && (
          <div className="twin-camera-loading">
            <span className="terminal-loading-spinner" />
            <strong>正在打开摄像头</strong>
          </div>
        )}
        {!showVideo && (
          <div className="twin-face-visual" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
        <i />
      </div>
      <div className="twin-face-copy">
        <strong>{statusText}</strong>
        <span>认证成功后才会执行开柜和业务记录。</span>
      </div>
      <div className="twin-dialog-actions">
        {(state === 'failed' || state === 'unmatched') && (
          <button type="button" className="twin-primary-action" onClick={startCamera}>
            重新扫脸
          </button>
        )}
        {canUseManualAuth && (
          <button
            type="button"
            className="twin-secondary-action twin-manual-auth-trigger"
            onClick={() => {
              stopCamera()
              setManualWorkNo('')
              setManualVisible(true)
            }}
          >
            输入工号
          </button>
        )}
      </div>

      {manualVisible && (
        <div className="twin-manual-auth-backdrop" role="dialog" aria-modal="true">
          <div className="twin-manual-auth-panel">
            <div className="twin-manual-auth-header">
              <strong>输入工号</strong>
              <button type="button" className="twin-icon-button" onClick={() => setManualVisible(false)} aria-label="关闭">×</button>
            </div>
            <output className="twin-manual-auth-output">{manualWorkNo || `请输入${WORK_NO_LENGTH}位工号`}</output>
            <div className="twin-manual-auth-hint">{manualWorkNo.length}/{WORK_NO_LENGTH}</div>
            <div className="twin-manual-auth-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(item => (
                <button type="button" key={item} onClick={() => appendManualDigit(item)}>{item}</button>
              ))}
              <button type="button" onClick={() => setManualWorkNo('')}>清空</button>
              <button type="button" onClick={() => appendManualDigit(0)}>0</button>
              <button type="button" onClick={() => setManualWorkNo(current => current.slice(0, -1))}>删除</button>
            </div>
            <div className="twin-manual-auth-actions">
              <button type="button" className="twin-secondary-action" onClick={() => setManualVisible(false)}>取消</button>
              <button type="button" className="twin-primary-action" disabled={manualWorkNo.trim().length !== WORK_NO_LENGTH} onClick={() => void submitManualAuth()}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
