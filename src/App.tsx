import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type {
  BorrowRecord,
  CabinetSlotStatus,
  CabinetTwinCabinet,
  CabinetTwinData,
  CabinetTwinSlot,
} from './types/electron'

type Operator = { empName: string; empWorkNo: string }
type OperationMode = 'receive' | 'borrow'
type FaceState = 'idle' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'

const MAX_RECOGNITION_ATTEMPTS = 5
const RECOGNITION_INTERVAL_MS = 220

const fallbackTwinData: CabinetTwinData = {
  updatedAt: new Date().toISOString(),
  cabinets: [
    { cabinetNo: '1', name: '双排柜', columnCount: 2, rowCount: 6, slots: createFallbackSlots('1', 2, 6) },
    { cabinetNo: '2', name: '三排柜', columnCount: 3, rowCount: 6, slots: createFallbackSlots('2', 3, 6) },
  ],
}

function createFallbackSlots(cabinetNo: string, columnCount: number, rowCount: number): CabinetTwinSlot[] {
  return Array.from({ length: columnCount * rowCount }, (_, index) => ({
    cabinetNo,
    slotNo: index + 1,
    itemId: null,
    itemName: '',
    category: '',
    spec: '',
    useType: null,
    quantity: 0,
    minQuantity: 2,
    status: 'empty',
  }))
}

function useClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return now
}

function formatDateTime(value?: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

function slotStatusLabel(status: CabinetSlotStatus) {
  return {
    available: '可用',
    low: '库存低',
    depleted: '已空',
    empty: '未绑定',
    fault: '故障',
  }[status] || '未知'
}

function useTypeLabel(useType: number | null) {
  if (useType === 0) return '领用'
  if (useType === 1) return '借用'
  if (useType === 2) return '领用 / 借用'
  return '未配置'
}

function canReceive(slot: CabinetTwinSlot | null) {
  return Boolean(slot?.itemId && slot.quantity > 0 && slot.useType !== 1)
}

function canBorrow(slot: CabinetTwinSlot | null) {
  return Boolean(slot?.itemId && slot.quantity > 0 && (slot.useType === 1 || slot.useType === 2))
}

function slotColor(status: CabinetSlotStatus) {
  if (status === 'available') return '#2ec8ff'
  if (status === 'low') return '#f6b73c'
  if (status === 'depleted' || status === 'fault') return '#ff5c7a'
  return '#5e7380'
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number, minSize = 12) {
  let size = fontSize
  do {
    ctx.font = `700 ${size}px "Noto Sans SC", "Microsoft YaHei", sans-serif`
    if (ctx.measureText(text).width <= maxWidth) return size
    size -= 1
  } while (size >= minSize)
  return minSize
}

function createSlotLabelTexture(slot: CabinetTwinSlot) {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 384
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const color = slotColor(slot.status)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(1, '#eef6fa')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28)

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 118, 88)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 54px Rajdhani, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(slot.slotNo), 59, 45)

  const itemName = slot.itemName || '未绑定'
  const nameSize = fitText(ctx, itemName, 560, 62, 30)
  ctx.font = `700 ${nameSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = slot.itemId ? '#183545' : '#8498a4'
  ctx.fillText(itemName, 144, 112)

  ctx.font = '500 34px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#607887'
  ctx.fillText(slot.spec || slotStatusLabel(slot.status), 144, 184)

  ctx.font = '700 52px Rajdhani, "Noto Sans SC", sans-serif'
  ctx.fillStyle = color
  ctx.fillText(`剩余 ${slot.quantity}`, 144, 280)

  ctx.font = '500 32px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#607887'
  ctx.textAlign = 'right'
  ctx.fillText(slotStatusLabel(slot.status), 720, 315)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function CabinetScene({
  cabinet,
  selectedSlot,
  onSelectSlot,
}: {
  cabinet: CabinetTwinCabinet
  selectedSlot: CabinetTwinSlot | null
  onSelectSlot: (slot: CabinetTwinSlot) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneStateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    slotMeshes: Map<string, THREE.Mesh>
    frameId: number
    pointer: THREE.Vector2
    raycaster: THREE.Raycaster
    dispose: () => void
  } | null>(null)
  const selectedSlotRef = useRef<CabinetTwinSlot | null>(selectedSlot)
  const slotsRef = useRef<CabinetTwinSlot[]>(cabinet.slots)
  const onSelectSlotRef = useRef(onSelectSlot)

  useEffect(() => {
    selectedSlotRef.current = selectedSlot
  }, [selectedSlot])

  useEffect(() => {
    slotsRef.current = cabinet.slots
  }, [cabinet.slots])

  useEffect(() => {
    onSelectSlotRef.current = onSelectSlot
  }, [onSelectSlot])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = null
    const cabinetGroup = new THREE.Group()
    cabinetGroup.rotation.y = cabinet.columnCount === 3 ? -0.24 : -0.2
    cabinetGroup.rotation.x = 0.045
    scene.add(cabinetGroup)

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(cabinet.columnCount === 3 ? 0.46 : 0.34, 0.24, 8.8)
    camera.lookAt(0, 0.04, -0.16)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 2.2)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
    keyLight.position.set(2.4, 6, 5)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0x7ec8e6, 8, 12)
    fillLight.position.set(-3, 2.8, 3.4)
    scene.add(fillLight)

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f9a6e,
      metalness: 0.28,
      roughness: 0.42,
    })
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x67ad7f,
      metalness: 0.24,
      roughness: 0.46,
    })
    const darkEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f6f4b,
      metalness: 0.2,
      roughness: 0.58,
    })
    const cavityMaterial = new THREE.MeshStandardMaterial({
      color: 0xb5dbc1,
      metalness: 0.1,
      roughness: 0.68,
    })
    const width = cabinet.columnCount * 1.38 + 0.52
    const height = cabinet.rowCount * 0.82 + 0.78
    const depth = 1.42

    const cabinetBox = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), sideMaterial)
    cabinetBox.position.set(0, 0, -0.58)
    cabinetBox.castShadow = true
    cabinetBox.receiveShadow = true
    cabinetGroup.add(cabinetBox)

    const innerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.3, height - 0.32, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xcae8d4, metalness: 0.12, roughness: 0.62 }),
    )
    innerPanel.position.set(0, 0, 0.18)
    innerPanel.receiveShadow = true
    cabinetGroup.add(innerPanel)

    const topCap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.56, 0.32, depth + 0.34), baseMaterial)
    topCap.position.set(0, height / 2 + 0.2, -0.52)
    topCap.castShadow = true
    cabinetGroup.add(topCap)

    const bottomCap = topCap.clone()
    bottomCap.position.y = -height / 2 - 0.18
    cabinetGroup.add(bottomCap)

    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.28, height + 0.46, depth + 0.28), baseMaterial)
    leftSide.position.set(-width / 2 - 0.2, 0, -0.52)
    leftSide.castShadow = true
    cabinetGroup.add(leftSide)

    const rightSide = leftSide.clone()
    rightSide.position.x = width / 2 + 0.16
    cabinetGroup.add(rightSide)

    const frontTopLip = new THREE.Mesh(new THREE.BoxGeometry(width + 0.26, 0.08, 0.18), darkEdgeMaterial)
    frontTopLip.position.set(0, height / 2 - 0.06, 0.24)
    frontTopLip.castShadow = true
    cabinetGroup.add(frontTopLip)

    const frontBottomLip = frontTopLip.clone()
    frontBottomLip.position.y = -height / 2 + 0.06
    cabinetGroup.add(frontBottomLip)

    const frontLeftLip = new THREE.Mesh(new THREE.BoxGeometry(0.08, height - 0.1, 0.18), darkEdgeMaterial)
    frontLeftLip.position.set(-width / 2 + 0.06, 0, 0.24)
    frontLeftLip.castShadow = true
    cabinetGroup.add(frontLeftLip)

    const frontRightLip = frontLeftLip.clone()
    frontRightLip.position.x = width / 2 - 0.06
    cabinetGroup.add(frontRightLip)

    const rearShadow = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.5, height + 0.46, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x276340, metalness: 0.08, roughness: 0.76 }),
    )
    rearShadow.position.set(0.24, -0.08, -1.3)
    rearShadow.receiveShadow = true
    cabinetGroup.add(rearShadow)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 1.8, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xeaf5ed, metalness: 0.04, roughness: 0.72 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, -height / 2 - 0.32, 0.08)
    floor.receiveShadow = true
    scene.add(floor)

    const slotMeshes = new Map<string, THREE.Mesh>()
    const doorGeometry = new THREE.BoxGeometry(1.2, 0.68, 0.16)
    const trimGeometry = new THREE.BoxGeometry(1.36, 0.84, 0.22)
    const cavityGeometry = new THREE.BoxGeometry(1.28, 0.76, 0.18)
    const itemGeometry = new THREE.BoxGeometry(0.5, 0.24, 0.3)

    for (const slot of cabinet.slots) {
      const col = Math.floor((slot.slotNo - 1) / cabinet.rowCount)
      const row = (slot.slotNo - 1) % cabinet.rowCount
      const x = (col - (cabinet.columnCount - 1) / 2) * 1.38
      const y = ((cabinet.rowCount - 1) / 2 - row) * 0.82
      const color = new THREE.Color(slotColor(slot.status))
      const cavity = new THREE.Mesh(cavityGeometry, cavityMaterial)
      cavity.position.set(x, y, 0.22)
      cavity.receiveShadow = true
      cabinetGroup.add(cavity)

      const trim = new THREE.Mesh(
        trimGeometry,
        new THREE.MeshStandardMaterial({
          color: 0x4f9a6e,
          emissive: color,
          emissiveIntensity: slot.itemId ? 0.035 : 0.012,
          metalness: 0.28,
          roughness: 0.46,
        }),
      )
      trim.position.set(x, y, 0.36)
      trim.castShadow = true
      trim.receiveShadow = true
      cabinetGroup.add(trim)

      const door = new THREE.Mesh(
        doorGeometry,
        new THREE.MeshPhysicalMaterial({
          color: slot.itemId ? 0xf7fcf8 : 0xd7eadc,
          transparent: true,
          opacity: slot.itemId ? 0.96 : 0.82,
          roughness: 0.34,
          metalness: 0.08,
          transmission: 0,
          emissive: color,
          emissiveIntensity: slot.status === 'available' ? 0.025 : 0.018,
        }),
      )
      door.position.set(x, y, 0.52)
      door.userData.slotKey = `${slot.cabinetNo}-${slot.slotNo}`
      door.userData.slotNo = slot.slotNo
      door.castShadow = true
      door.receiveShadow = true
      cabinetGroup.add(door)
      slotMeshes.set(door.userData.slotKey, door)

      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(1.16, 0.08, 0.84),
        new THREE.MeshStandardMaterial({ color: 0x3f855c, metalness: 0.2, roughness: 0.5 }),
      )
      shelf.position.set(x, y - 0.36, 0.34)
      shelf.castShadow = true
      cabinetGroup.add(shelf)

      if (slot.itemId) {
        const itemBlock = new THREE.Mesh(
          itemGeometry,
          new THREE.MeshStandardMaterial({
            color: slot.status === 'depleted' ? 0xc8d0d6 : 0xffffff,
            metalness: 0.08,
            roughness: 0.42,
          }),
        )
        itemBlock.position.set(x - 0.22, y - 0.14, 0.72)
        itemBlock.castShadow = true
        cabinetGroup.add(itemBlock)
      }

      const labelTexture = createSlotLabelTexture(slot)
      if (labelTexture) {
        const label = new THREE.Mesh(
          new THREE.PlaneGeometry(1.14, 0.6),
          new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true,
            depthTest: true,
          }),
        )
        label.position.set(x, y, 0.625)
        label.userData.slotKey = `${slot.cabinetNo}-${slot.slotNo}`
        label.userData.slotNo = slot.slotNo
        cabinetGroup.add(label)
        slotMeshes.set(`${slot.cabinetNo}-${slot.slotNo}-label`, label)
      }
    }

    const pointer = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)
      const aspect = width / height
      const viewHeight = cabinet.rowCount * 0.82 + 1.55
      const fov = THREE.MathUtils.degToRad(camera.fov)
      const distance = viewHeight / (2 * Math.tan(fov / 2))
      camera.aspect = aspect
      camera.position.x = cabinet.columnCount === 3 ? 0.52 : 0.38
      camera.position.z = distance + (aspect < 0.8 ? 2.1 : 1.35)
      camera.lookAt(0, 0.04, -0.16)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const intersections = raycaster.intersectObjects(Array.from(slotMeshes.values()), false)
      const first = intersections[0]?.object
      const slotNo = first?.userData?.slotNo
      if (!slotNo) return
      const slot = slotsRef.current.find(current => current.slotNo === slotNo)
      if (slot) onSelectSlotRef.current(slot)
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', resize)
    resize()

    const animate = () => {
      const selected = selectedSlotRef.current
      for (const mesh of slotMeshes.values()) {
        const selectedKey = selected ? `${selected.cabinetNo}-${selected.slotNo}` : ''
        const active = Boolean(selectedKey && mesh.userData.slotKey === selectedKey)
        if (mesh.geometry instanceof THREE.BoxGeometry) {
          mesh.scale.z = THREE.MathUtils.lerp(mesh.scale.z, active ? 1.55 : 1, 0.1)
          mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, active ? 0.72 : 0.52, 0.1)
        } else if (mesh.geometry instanceof THREE.PlaneGeometry) {
          mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, active ? 0.86 : 0.625, 0.1)
        }
      }
      renderer.render(scene, camera)
      const state = sceneStateRef.current
      if (state) state.frameId = window.requestAnimationFrame(animate)
    }

    const dispose = () => {
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', resize)
      const state = sceneStateRef.current
      if (state?.frameId) window.cancelAnimationFrame(state.frameId)
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => {
            if ('map' in material && material.map) material.map.dispose()
            material.dispose()
          })
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }

    sceneStateRef.current = { renderer, scene, camera, slotMeshes, frameId: 0, pointer, raycaster, dispose }
    animate()

    return () => {
      dispose()
      sceneStateRef.current = null
    }
  }, [cabinet])

  return (
    <div className="twin-3d-viewport">
      <div ref={mountRef} className="twin-3d-canvas" />
    </div>
  )
}

function CabinetModel({
  cabinet,
  selectedSlot,
  onSelectSlot,
}: {
  cabinet: CabinetTwinCabinet
  selectedSlot: CabinetTwinSlot | null
  onSelectSlot: (slot: CabinetTwinSlot) => void
}) {
  return (
    <section className="twin-cabinet twin-cabinet-3d" aria-label={cabinet.name}>
      <CabinetScene cabinet={cabinet} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
    </section>
  )
}

function FaceGate({
  onAuthenticated,
}: {
  onAuthenticated: (operator: Operator) => void
}) {
  const [state, setState] = useState<FaceState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runRef = useRef(0)

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
          onAuthenticated({ empName: result.empName, empWorkNo: result.empWorkNo })
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
  }, [captureFrame, onAuthenticated, stopCamera, waitForVideoReady])

  const startCamera = useCallback(async () => {
    runRef.current += 1
    setErrorMsg('')
    setState('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      void runRecognition()
    } catch {
      setErrorMsg('无法访问摄像头，请检查权限')
      setState('failed')
    }
  }, [runRecognition])

  useEffect(() => () => stopCamera(), [stopCamera])

  const statusText = {
    idle: '点击开始后进行身份认证',
    camera: '摄像头已开启',
    recognizing: '正在识别操作人',
    success: '认证通过',
    failed: errorMsg || '认证异常',
    unmatched: '未匹配到授权身份',
  }[state]

  const showVideo = state === 'camera' || state === 'recognizing'

  return (
    <div className="twin-face-gate">
      <div className={`twin-face-preview twin-face-${state}`}>
        {showVideo ? (
          <video ref={videoRef} autoPlay playsInline muted />
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
        {(state === 'idle' || state === 'failed' || state === 'unmatched') && (
          <button type="button" className="twin-primary-action" onClick={startCamera}>
            {state === 'idle' ? '开始扫脸' : '重新扫脸'}
          </button>
        )}
      </div>
    </div>
  )
}

function SlotDialog({
  slot,
  operating,
  onClose,
  onOperate,
}: {
  slot: CabinetTwinSlot
  operating: boolean
  onClose: () => void
  onOperate: (mode: OperationMode, quantity: number, operator: Operator) => Promise<void>
}) {
  const [mode, setMode] = useState<OperationMode>(canReceive(slot) ? 'receive' : 'borrow')
  const [quantity, setQuantity] = useState(1)
  const [step, setStep] = useState<'quantity' | 'face'>('quantity')
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(canReceive(slot) ? 'receive' : 'borrow')
    setQuantity(1)
    setStep('quantity')
    setError('')
  }, [slot])

  const maxQuantity = Math.max(slot.quantity, 1)
  const canProceed = slot.itemId && quantity > 0 && quantity <= maxQuantity && !operating

  const proceedToFace = () => {
    if (!slot.itemId) {
      setError('该格口未绑定物品')
      return
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`请输入 1 到 ${maxQuantity} 之间的数量`)
      return
    }
    setError('')
    setStep('face')
  }

  const handleAuthenticated = async (operator: Operator) => {
    setError('')
    await onOperate(mode, quantity, operator)
  }

  return (
    <div className="twin-modal-backdrop" role="dialog" aria-modal="true">
      <section className="twin-modal twin-slot-dialog">
        <header className="twin-modal-header">
          <div>
            <span>{slot.cabinetNo} 号柜 / {slot.slotNo} 号格</span>
            <h3>{slot.itemName || '未绑定物品'}</h3>
          </div>
          <button type="button" className="twin-icon-button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className={step === 'quantity' ? 'twin-slot-dialog-grid twin-slot-dialog-quantity' : 'twin-slot-dialog-grid'}>
          <div className="twin-slot-facts">
            <div>
              <span>当前库存</span>
              <strong>{slot.quantity}</strong>
            </div>
            <div>
              <span>支持动作</span>
              <strong>{useTypeLabel(slot.useType)}</strong>
            </div>
            <div>
              <span>规格</span>
              <strong>{slot.spec || '--'}</strong>
            </div>
            <div>
              <span>状态</span>
              <strong>{slotStatusLabel(slot.status)}</strong>
            </div>
          </div>

          <div className="twin-operation-panel">
            {step === 'quantity' ? (
              <>
                <div className="twin-segmented">
                  <button
                    type="button"
                    className={mode === 'receive' ? 'is-active' : ''}
                    disabled={!canReceive(slot)}
                    onClick={() => setMode('receive')}
                  >
                    领用
                  </button>
                  <button
                    type="button"
                    className={mode === 'borrow' ? 'is-active' : ''}
                    disabled={!canBorrow(slot)}
                    onClick={() => setMode('borrow')}
                  >
                    借用
                  </button>
                </div>

                <label className="twin-quantity-field twin-quantity-field-large">
                  <span>输入数量</span>
                  <input
                    type="number"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    autoFocus
                    onChange={event => setQuantity(Math.min(Math.max(Number(event.target.value) || 1, 1), maxQuantity))}
                  />
                </label>
              </>
            ) : (
              <FaceGate onAuthenticated={handleAuthenticated} />
            )}

            {error && <div className="twin-error">{error}</div>}

            <div className="twin-dialog-actions">
              {step === 'face' && (
                <button type="button" className="twin-secondary-action" disabled={operating} onClick={() => setStep('quantity')}>
                  返回修改数量
                </button>
              )}
              <button type="button" className="twin-secondary-action" onClick={onClose}>取消</button>
              {step === 'quantity' && (
                <button type="button" className="twin-primary-action" disabled={!canProceed} onClick={proceedToFace}>
                  下一步：扫脸认证
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ReturnDialog({
  records,
  loading,
  operating,
  onClose,
  onAuthenticated,
  onReturn,
}: {
  records: BorrowRecord[]
  loading: boolean
  operating: boolean
  onClose: () => void
  onAuthenticated: (operator: Operator) => Promise<void>
  onReturn: (record: BorrowRecord, quantity: number) => Promise<void>
}) {
  const [operator, setOperator] = useState<Operator | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  const selected = useMemo(
    () => records.find(record => String(record.id) === selectedId) || records[0] || null,
    [records, selectedId],
  )

  useEffect(() => {
    if (!selectedId && records[0]) setSelectedId(String(records[0].id))
  }, [records, selectedId])

  useEffect(() => {
    setQuantity(selected?.pendingQuantity || 1)
  }, [selected])

  const handleAuthenticated = async (nextOperator: Operator) => {
    setOperator(nextOperator)
    await onAuthenticated(nextOperator)
  }

  return (
    <div className="twin-modal-backdrop" role="dialog" aria-modal="true">
      <section className="twin-modal twin-return-dialog">
        <header className="twin-modal-header">
          <div>
            <span>借用归还</span>
            <h3>{operator ? `${operator.empName} 的未归还记录` : '请先扫脸认证'}</h3>
          </div>
          <button type="button" className="twin-icon-button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        {!operator ? (
          <FaceGate onAuthenticated={handleAuthenticated} />
        ) : (
          <div className="twin-return-content">
            {loading ? (
              <div className="twin-empty-state">正在查询未归还记录...</div>
            ) : records.length === 0 ? (
              <div className="twin-empty-state">当前人员没有未归还借用记录。</div>
            ) : (
              <>
                <div className="twin-record-list">
                  {records.map(record => (
                    <button
                      type="button"
                      key={record.id}
                      className={String(record.id) === String(selected?.id) ? 'is-active' : ''}
                      onClick={() => setSelectedId(String(record.id))}
                    >
                      <strong>{record.itemName}</strong>
                      <span>未归还 {record.pendingQuantity} / {record.cabinetName || '柜体'} {record.slotNo ? `${record.slotNo}号格` : ''}</span>
                      <em>{formatDateTime(record.borrowTime)}</em>
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="twin-return-form">
                    <label className="twin-quantity-field">
                      <span>归还数量</span>
                      <input
                        type="number"
                        min={1}
                        max={selected.pendingQuantity || 1}
                        value={quantity}
                        onChange={event => {
                          const max = selected.pendingQuantity || 1
                          setQuantity(Math.min(Math.max(Number(event.target.value) || 1, 1), max))
                        }}
                      />
                    </label>
                    <div className="twin-dialog-actions">
                      <button type="button" className="twin-secondary-action" onClick={onClose}>取消</button>
                      <button
                        type="button"
                        className="twin-primary-action"
                        disabled={operating}
                        onClick={() => onReturn(selected, quantity)}
                      >
                        {operating ? '处理中...' : '确认归还并开门'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const now = useClock()
  const [twinData, setTwinData] = useState<CabinetTwinData>(fallbackTwinData)
  const [selectedSlot, setSelectedSlot] = useState<CabinetTwinSlot | null>(null)
  const [slotDialog, setSlotDialog] = useState<CabinetTwinSlot | null>(null)
  const [returnVisible, setReturnVisible] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [operating, setOperating] = useState(false)
  const [message, setMessage] = useState('系统待机，点击柜体格口后输入数量。')
  const [lastOperator, setLastOperator] = useState<Operator | null>(null)

  const refreshTwinData = useCallback(async (operator?: Operator) => {
    setLoading(true)
    try {
      const data = await window.electronAPI.getCabinetTwinData(operator)
      setTwinData(data)
      setMessage('柜体数据已同步。')
    } catch (error) {
      console.error(error)
      setMessage(`柜体数据同步失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshTwinData()
    const timer = window.setInterval(() => void refreshTwinData(lastOperator || undefined), 30000)
    return () => window.clearInterval(timer)
  }, [lastOperator, refreshTwinData])

  const handleSelectSlot = (slot: CabinetTwinSlot) => {
    setSelectedSlot(slot)
    if (!slot.itemId) {
      setMessage(`${slot.cabinetNo}号柜 ${slot.slotNo}号格尚未绑定物品。`)
      return
    }
    setSlotDialog(slot)
  }

  const handleOperate = async (mode: OperationMode, quantity: number, operator: Operator) => {
    if (!slotDialog?.itemId) return
    setOperating(true)
    setLastOperator(operator)
    try {
      await window.electronAPI.operateCabinetSlot({
        action: mode,
        itemId: slotDialog.itemId,
        quantity,
        operator,
      })
      setMessage(`${operator.empName} 已完成${mode === 'receive' ? '领用' : '借用'}：${slotDialog.itemName} x ${quantity}。`)
      setSlotDialog(null)
      await refreshTwinData(operator)
    } catch (error) {
      console.error(error)
      setMessage(`${mode === 'receive' ? '领用' : '借用'}失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setOperating(false)
    }
  }

  const loadBorrowRecords = async (operator: Operator) => {
    setRecordsLoading(true)
    setLastOperator(operator)
    try {
      const records = await window.electronAPI.getOpenBorrowRecords(operator)
      setBorrowRecords(records)
      setMessage(`已查询到 ${records.length} 条未归还记录。`)
    } catch (error) {
      console.error(error)
      setMessage(`未归还记录查询失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRecordsLoading(false)
    }
  }

  const handleReturn = async (record: BorrowRecord, quantity: number) => {
    if (!lastOperator) {
      setMessage('请先完成人脸认证。')
      return
    }
    setOperating(true)
    try {
      await window.electronAPI.returnBorrowRecord({
        borrowRecordId: record.id,
        itemId: record.itemId,
        quantity,
        operator: lastOperator,
        remark: `终端归还：${lastOperator.empName}`,
      })
      setMessage(`${lastOperator.empName} 已归还：${record.itemName} x ${quantity}。`)
      await loadBorrowRecords(lastOperator)
      await refreshTwinData(lastOperator)
    } catch (error) {
      console.error(error)
      setMessage(`归还失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setOperating(false)
    }
  }

  return (
    <main className="digital-twin-shell">
      <header className="twin-header">
        <div>
          <h1>行小助物品领用</h1>
        </div>
        <div className="twin-header-actions">
          <button type="button" className="twin-utility-button" onClick={() => void refreshTwinData(lastOperator || undefined)}>
            {loading ? '同步中' : '刷新数据'}
          </button>
          <button type="button" className="twin-utility-button twin-return-button" onClick={() => setReturnVisible(true)}>
            归还
          </button>
          <div className="twin-clock">
            <strong>{now.toLocaleTimeString('zh-CN', { hour12: false })}</strong>
            <span>{now.toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </header>

      <section className="twin-stage">
        <div className="twin-cabinet-row">
          {twinData.cabinets.map(cabinet => (
            <CabinetModel
              key={cabinet.cabinetNo}
              cabinet={cabinet}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
            />
          ))}
        </div>

      </section>

      {slotDialog && (
        <SlotDialog
          slot={slotDialog}
          operating={operating}
          onClose={() => setSlotDialog(null)}
          onOperate={handleOperate}
        />
      )}

      {returnVisible && (
        <ReturnDialog
          records={borrowRecords}
          loading={recordsLoading}
          operating={operating}
          onClose={() => {
            setReturnVisible(false)
            setBorrowRecords([])
          }}
          onAuthenticated={loadBorrowRecords}
          onReturn={handleReturn}
        />
      )}
    </main>
  )
}
