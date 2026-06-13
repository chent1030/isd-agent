import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  BorrowRecord,
  CabinetCatalogItem,
  CabinetCategory,
} from './types/electron'

type Operator = { empName: string; empWorkNo: string }
type OperationMode = 'receive' | 'borrow'
type FaceState = 'idle' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'
type AppScreen = 'categories' | 'items'

const MAX_RECOGNITION_ATTEMPTS = 5
const RECOGNITION_INTERVAL_MS = 220
const CAMERA_PREFERENCE_KEY = 'isd-agent.camera.preference.v1'
const CATEGORY_ACCENTS = ['#2f8f67', '#1f7da5', '#9a6f2f', '#8a6eb8', '#c35f4c', '#4f7d51']
const ITEM_ACCENTS = ['#2f8f67', '#1f7da5', '#9a6f2f', '#c35f4c']

interface CameraPreference {
  deviceId: string
  groupId?: string
  label?: string
  savedAt: string
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

function useTypeLabel(useType: number | null) {
  if (useType === 0) return '领用'
  if (useType === 1) return '借用'
  if (useType === 2) return '领用 / 借用'
  return '未配置'
}

function getDisplayInitial(value?: string) {
  return (value || '物').trim().slice(0, 1)
}

function ParticleField() {
  const particles = useMemo(
    () => Array.from({ length: 58 }, (_, index) => ({
      id: index,
      x: (index * 37) % 100,
      y: (index * 53) % 100,
      size: 3 + (index % 5),
      delay: (index % 11) * 0.36,
      duration: 7 + (index % 7) * 0.62,
    })),
    [],
  )

  return (
    <div className="twin-particle-field" aria-hidden="true">
      {particles.map(particle => (
        <span
          key={particle.id}
          style={{
            '--particle-x': `${particle.x}%`,
            '--particle-y': `${particle.y}%`,
            '--particle-size': `${particle.size}px`,
            '--particle-delay': `${particle.delay}s`,
            '--particle-duration': `${particle.duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
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

function clampQuantity(value: number, maxQuantity: number) {
  const max = Math.max(Math.floor(maxQuantity) || 1, 1)
  return Math.min(Math.max(Math.floor(value) || 1, 1), max)
}

function QuantityPicker({
  label,
  value,
  max,
  onChange,
}: {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
}) {
  const safeMax = Math.max(Math.floor(max) || 1, 1)
  const quickValues = safeMax <= 6
    ? Array.from({ length: safeMax }, (_, index) => index + 1)
    : [1, 2, 3, 5].filter(item => item <= safeMax)
  const showKeypad = safeMax > 6
  const displayValue = clampQuantity(value, safeMax)

  const setQuantity = (nextValue: number) => onChange(clampQuantity(nextValue, safeMax))
  const appendDigit = (digit: number) => {
    const nextText = `${displayValue === 0 ? '' : displayValue}${digit}`
    setQuantity(Number(nextText))
  }
  const removeDigit = () => setQuantity(Math.floor(displayValue / 10) || 1)

  return (
    <div className="twin-touch-quantity" aria-label={label}>
      <div className="twin-touch-quantity-label">
        <span>{label}</span>
        <em>最多 {safeMax}</em>
      </div>

      <div className="twin-touch-stepper">
        <button type="button" disabled={displayValue <= 1} onClick={() => setQuantity(displayValue - 1)} aria-label="减少数量">
          -
        </button>
        <output>{displayValue}</output>
        <button type="button" disabled={displayValue >= safeMax} onClick={() => setQuantity(displayValue + 1)} aria-label="增加数量">
          +
        </button>
      </div>

      <div className="twin-touch-quick-values">
        {quickValues.map(item => (
          <button
            type="button"
            key={item}
            className={displayValue === item ? 'is-active' : ''}
            onClick={() => setQuantity(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className={displayValue === safeMax ? 'is-active' : ''}
          onClick={() => setQuantity(safeMax)}
        >
          全部
        </button>
      </div>

      {showKeypad && (
        <div className="twin-touch-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(item => (
            <button type="button" key={item} onClick={() => appendDigit(item)}>
              {item}
            </button>
          ))}
          <button type="button" onClick={() => setQuantity(1)}>清空</button>
          <button type="button" onClick={() => appendDigit(0)}>0</button>
          <button type="button" onClick={removeDigit}>删除</button>
        </div>
      )}
    </div>
  )
}

function ItemDialog({
  item,
  operating,
  onClose,
  onOperate,
}: {
  item: CabinetCatalogItem
  operating: boolean
  onClose: () => void
  onOperate: (item: CabinetCatalogItem, mode: OperationMode, quantity: number, operator: Operator) => Promise<void>
}) {
  const [mode, setMode] = useState<OperationMode>(item.useType === 1 ? 'borrow' : 'receive')
  const [quantity, setQuantity] = useState(1)
  const [step, setStep] = useState<'quantity' | 'face'>('quantity')
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(item.useType === 1 ? 'borrow' : 'receive')
    setQuantity(1)
    setStep('quantity')
    setError('')
  }, [item])

  const maxQuantity = Math.max(Math.min(item.stock, item.cabinetQuantity), 1)
  const canReceiveItem = item.stock > 0 && item.cabinetQuantity > 0 && item.useType !== 1
  const canBorrowItem = item.stock > 0 && item.cabinetQuantity > 0 && (item.useType === 1 || item.useType === 2)
  const canProceed = quantity > 0 && quantity <= maxQuantity && !operating && (mode === 'receive' ? canReceiveItem : canBorrowItem)

  const proceedToFace = () => {
    if (item.stock <= 0) {
      setError('可用数量不足')
      return
    }
    if (item.cabinetQuantity <= 0) {
      setError('柜内可领数量不足，请联系管理员补货')
      return
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`请选择 1 到 ${maxQuantity} 之间的数量`)
      return
    }
    setError('')
    setStep('face')
  }

  const handleAuthenticated = async (operator: Operator) => {
    setError('')
    await onOperate(item, mode, quantity, operator)
  }

  return (
    <div className="twin-modal-backdrop" role="dialog" aria-modal="true">
      <section className="twin-modal twin-item-dialog">
        <header className="twin-modal-header">
          <div>
            <span>{item.category || '未分类'}</span>
            <h3>{item.name}</h3>
          </div>
          <button type="button" className="twin-icon-button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className={step === 'quantity' ? 'twin-item-dialog-grid twin-item-dialog-quantity' : 'twin-item-dialog-grid'}>
          <div className="twin-slot-facts">
            <div>
              <span>格口内数量</span>
              <strong>{item.cabinetQuantity}</strong>
            </div>
            <div>
              <span>规格</span>
              <strong>{item.spec || '--'}</strong>
            </div>
            <div>
              <span>授权</span>
              <strong>{item.authRequired ? '需要授权' : '无需授权'}</strong>
            </div>
          </div>

          <div className="twin-operation-panel">
            {step === 'quantity' ? (
              <>
                <div className="twin-segmented">
                  <button
                    type="button"
                    className={mode === 'receive' ? 'is-active' : ''}
                    disabled={!canReceiveItem}
                    onClick={() => setMode('receive')}
                  >
                    领用
                  </button>
                  <button
                    type="button"
                    className={mode === 'borrow' ? 'is-active' : ''}
                    disabled={!canBorrowItem}
                    onClick={() => setMode('borrow')}
                  >
                    借用
                  </button>
                </div>

                <QuantityPicker
                  label="选择数量"
                  value={quantity}
                  max={maxQuantity}
                  onChange={setQuantity}
                />
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
                    <QuantityPicker
                      label="归还数量"
                      value={quantity}
                      max={selected.pendingQuantity || 1}
                      onChange={setQuantity}
                    />
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
  const [screen, setScreen] = useState<AppScreen>('categories')
  const [categories, setCategories] = useState<CabinetCategory[]>([])
  const [items, setItems] = useState<CabinetCatalogItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [itemDialog, setItemDialog] = useState<CabinetCatalogItem | null>(null)
  const [returnVisible, setReturnVisible] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [operating, setOperating] = useState(false)
  const [message, setMessage] = useState('请选择类别。')
  const [lastOperator, setLastOperator] = useState<Operator | null>(null)
  const selectedCategory = useMemo(
    () => categories.find(category => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  )

  const refreshCatalog = useCallback(async (categoryId = selectedCategoryId) => {
    setLoading(true)
    try {
      const nextCategories = await window.electronAPI.getCabinetCategories()
      const nextCategoryId = categoryId || nextCategories[0]?.id || ''
      const nextItems = nextCategoryId ? await window.electronAPI.getCabinetCatalogItems(nextCategoryId) : []
      setCategories(nextCategories)
      setSelectedCategoryId(nextCategoryId)
      setItems(nextItems)
      setMessage('物品数据已同步。')
    } catch (error) {
      console.error(error)
      setMessage(`物品数据同步失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    void refreshCatalog()
    const timer = window.setInterval(() => void refreshCatalog(), 30000)
    return () => window.clearInterval(timer)
  }, [refreshCatalog])

  const handleSelectCategory = async (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    await refreshCatalog(categoryId)
    setScreen('items')
  }

  const returnHome = useCallback(() => {
    setScreen('categories')
    setItemDialog(null)
    setReturnVisible(false)
    setBorrowRecords([])
  }, [])

  const openReturnDialog = () => {
    setScreen('categories')
    setReturnVisible(true)
  }

  const handleOperateItem = async (item: CabinetCatalogItem, mode: OperationMode, quantity: number, operator: Operator) => {
    setOperating(true)
    setLastOperator(operator)
    try {
      const result = await window.electronAPI.operateCabinetItem({
        action: mode,
        itemId: item.id,
        quantity,
        operator,
      })
      const openedCount = Array.isArray((result as any)?.locations) ? (result as any).locations.length : 0
      await refreshCatalog()
      setMessage(`${operator.empName} 已完成${mode === 'receive' ? '领用' : '借用'}：${item.name} x ${quantity}${openedCount ? `，已打开 ${openedCount} 个格口` : ''}。`)
    } catch (error) {
      console.error(error)
      setMessage(`${mode === 'receive' ? '领用' : '借用'}失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setOperating(false)
      returnHome()
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
      returnHome()
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
      await refreshCatalog()
      setMessage(`${lastOperator.empName} 已归还：${record.itemName} x ${quantity}。`)
    } catch (error) {
      console.error(error)
      setMessage(`归还失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setOperating(false)
      returnHome()
    }
  }

  return (
    <main className="digital-twin-shell">
      <ParticleField />
      <header className="twin-header">
        <div>
          <h1>行小助物品领用</h1>
        </div>
        <div className="twin-header-actions">
          <button type="button" className="twin-utility-button" onClick={() => void refreshCatalog()}>
            {loading ? '同步中' : '刷新数据'}
          </button>
          <button type="button" className="twin-utility-button twin-return-button" onClick={openReturnDialog}>
            归还
          </button>
          <div className="twin-clock">
            <strong>{now.toLocaleTimeString('zh-CN', { hour12: false })}</strong>
            <span>{now.toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </header>

      <section className="terminal-stage">
        {screen === 'categories' && (
          <div className="terminal-page terminal-category-page">
            <div className="catalog-category-panel">
              {categories.length === 0 ? (
                <div className="catalog-empty-state">暂无类别</div>
              ) : categories.map((category, index) => (
                <button
                  type="button"
                  key={category.id}
                  className="catalog-category"
                  style={{ '--card-accent': CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length] } as React.CSSProperties}
                  onClick={() => void handleSelectCategory(category.id)}
                >
                  <i>{getDisplayInitial(category.name)}</i>
                  <strong>{category.name}</strong>
                  <em>{category.itemCount} 种物品</em>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'items' && (
          <div className="terminal-page">
            <div className="terminal-page-header">
              <div>
                <h2>{selectedCategory?.name || '选择物品'}</h2>
              </div>
              <div className="terminal-page-actions">
                <button type="button" className="twin-secondary-action" onClick={() => setScreen('categories')}>返回类别</button>
              </div>
            </div>
            <div className="catalog-item-panel">
              {items.length === 0 ? (
                <div className="catalog-empty-state">当前类别暂无可用物品</div>
              ) : items.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className="catalog-item-card"
                  style={{ '--card-accent': ITEM_ACCENTS[Math.abs(Number(item.id) || 0) % ITEM_ACCENTS.length] } as React.CSSProperties}
                  disabled={item.stock <= 0 || item.cabinetQuantity <= 0}
                  onClick={() => setItemDialog(item)}
                >
                  <span>{useTypeLabel(item.useType)}</span>
                  <strong>{item.name}</strong>
                  <em>{item.spec || '无规格'}</em>
                  <div>
                    <b><small>格口内数量</small>{item.cabinetQuantity}</b>
                  </div>
                  <i>{getDisplayInitial(item.name)}</i>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {itemDialog && (
        <ItemDialog
          item={itemDialog}
          operating={operating}
          onClose={() => setItemDialog(null)}
          onOperate={handleOperateItem}
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
