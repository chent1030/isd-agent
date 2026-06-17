import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { FaceState, Operator } from '../../types/terminal'

const MAX_RECOGNITION_ATTEMPTS = 5
const RECOGNITION_INTERVAL_MS = 220
const WORK_NO_LENGTH = 8
const CAMERA_PREFERENCE_KEY = 'isd-agent.camera.preference.v1'

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
    setVideoReady(false)
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
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.86).split(',')[1]
  }, [])

  const runRecognition = useCallback(async () => {
    const runId = runRef.current
    const ready = await waitForVideoReady()
    if (!ready || runId !== runRef.current) return

    setVideoReady(true)
    setState('recognizing')
    try {
      for (let attempt = 0; attempt < MAX_RECOGNITION_ATTEMPTS; attempt += 1) {
        if (runId !== runRef.current) return
        if (attempt > 0) await new Promise(resolve => window.setTimeout(resolve, RECOGNITION_INTERVAL_MS))
        const base64 = captureFrame()
        if (!base64) continue
        const result = await window.electronAPI.recognizeFace(base64)
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
      setErrorMsg('人脸识别服务异常，请重试')
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
      const ready = await waitForVideoReady()
      if (!ready || runId !== runRef.current) {
        stopCamera()
        setErrorMsg('摄像头画面加载失败，请重试')
        setState('failed')
        setManualWorkNo('')
        setManualVisible(true)
        return
      }
      setVideoReady(true)
      setState('camera')
      void runRecognition()
    } catch {
      setErrorMsg('无法访问摄像头，请检查权限')
      setState('failed')
      setManualWorkNo('')
      setManualVisible(true)
    }
  }, [runRecognition, state, stopCamera, waitForVideoReady])

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
        {showVideo ? (
          <>
            <video ref={videoRef} className={videoReady ? '' : 'is-waiting'} autoPlay playsInline muted />
            {showCameraLoading && (
              <div className="twin-camera-loading">
                <span className="terminal-loading-spinner" />
                <strong>正在打开摄像头</strong>
              </div>
            )}
          </>
        ) : (
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
