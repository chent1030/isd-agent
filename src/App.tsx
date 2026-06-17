import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CategoryPage } from './components/terminal/CategoryPage'
import { ItemsPage } from './components/terminal/ItemsPage'
import { ItemDialog } from './components/terminal/ItemDialog'
import { ParticleField } from './components/terminal/ParticleField'
import { ReturnDialog } from './components/terminal/ReturnDialog'
import { TerminalClock } from './components/terminal/TerminalClock'
import type {
  BorrowRecord,
  CabinetCatalogItem,
  CabinetCategory,
} from './types/electron'
import type { AppNotice, AppScreen, OperationMode, Operator } from './types/terminal'
import { getUserFacingErrorMessage } from './user-facing-error'

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('categories')
  const [categories, setCategories] = useState<CabinetCategory[]>([])
  const [items, setItems] = useState<CabinetCatalogItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [itemDialog, setItemDialog] = useState<CabinetCatalogItem | null>(null)
  const [returnVisible, setReturnVisible] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [operating, setOperating] = useState(false)
  const [notice, setNotice] = useState<AppNotice | null>(null)
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(DEFAULT_IDLE_TIMEOUT_MS)
  const [lastOperator, setLastOperator] = useState<Operator | null>(null)
  const lastActivityAtRef = useRef(Date.now())
  const selectedCategory = useMemo(
    () => categories.find(category => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  )

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const nextCategories = await window.electronAPI.getCabinetCategories()
      setCategories(nextCategories)
    } catch (error) {
      console.error(error)
      setNotice({ tone: 'error', text: `类别数据加载失败：${getUserFacingErrorMessage(error)}` })
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const loadItems = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setItems([])
      return
    }
    setItemsLoading(true)
    try {
      const nextItems = await window.electronAPI.getCabinetCatalogItems(categoryId)
      setItems(nextItems)
    } catch (error) {
      console.error(error)
      setItems([])
      setNotice({ tone: 'error', text: `物品数据加载失败：${getUserFacingErrorMessage(error)}` })
    } finally {
      setItemsLoading(false)
    }
  }, [])

  const refreshCatalog = useCallback(async (showButtonLoading = false) => {
    if (showButtonLoading) setRefreshing(true)
    try {
      const nextCategories = await window.electronAPI.getCabinetCategories()
      setCategories(nextCategories)
      if (screen === 'items' && selectedCategoryId) {
        const nextItems = await window.electronAPI.getCabinetCatalogItems(selectedCategoryId)
        setItems(nextItems)
      }
    } catch (error) {
      console.error(error)
      setNotice({ tone: 'error', text: `数据刷新失败：${getUserFacingErrorMessage(error)}` })
    } finally {
      if (showButtonLoading) setRefreshing(false)
    }
  }, [screen, selectedCategoryId])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (screen !== 'items') return
    void loadItems(selectedCategoryId)
  }, [loadItems, screen, selectedCategoryId])

  useEffect(() => {
    let cancelled = false
    window.electronAPI.getAppConfig()
      .then(config => {
        if (!cancelled && Number.isFinite(config.idleTimeoutMs) && config.idleTimeoutMs > 0) {
          setIdleTimeoutMs(config.idleTimeoutMs)
        }
      })
      .catch(error => {
        console.error(error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setItems([])
    setScreen('items')
  }, [])

  const returnHome = useCallback(() => {
    setScreen('categories')
    setItemDialog(null)
    setReturnVisible(false)
    setBorrowRecords([])
  }, [])

  const isAwayFromHome = screen !== 'categories' || itemDialog !== null || returnVisible

  useEffect(() => {
    const updateActivity = () => {
      lastActivityAtRef.current = Date.now()
    }
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'wheel']

    events.forEach(eventName => window.addEventListener(eventName, updateActivity, { passive: true }))
    updateActivity()

    return () => {
      events.forEach(eventName => window.removeEventListener(eventName, updateActivity))
    }
  }, [])

  useEffect(() => {
    if (!isAwayFromHome) {
      lastActivityAtRef.current = Date.now()
      return
    }

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityAtRef.current < idleTimeoutMs) return
      setNotice({ tone: 'info', text: '长时间未操作，已返回首页。' })
      returnHome()
      lastActivityAtRef.current = Date.now()
    }, 1000)

    return () => window.clearInterval(timer)
  }, [idleTimeoutMs, isAwayFromHome, returnHome])
  const showCategories = useCallback(() => {
    setScreen('categories')
  }, [])

  const openReturnDialog = useCallback(() => {
    setScreen('categories')
    setReturnVisible(true)
  }, [])

  const handleOperateItem = useCallback(async (item: CabinetCatalogItem, mode: OperationMode, quantity: number, operator: Operator) => {
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
      setNotice({
        tone: 'success',
        text: `${operator.empName} 已完成${mode === 'receive' ? '领用' : '借用'}：${item.name} x ${quantity}${openedCount ? `，已打开 ${openedCount} 个格口` : ''}。`,
      })
    } catch (error) {
      console.error(error)
      setNotice({ tone: 'error', text: `${mode === 'receive' ? '领用' : '借用'}失败：${getUserFacingErrorMessage(error)}` })
    } finally {
      setOperating(false)
      returnHome()
    }
  }, [refreshCatalog, returnHome])

  const loadBorrowRecords = useCallback(async (operator: Operator) => {
    setRecordsLoading(true)
    setLastOperator(operator)
    try {
      const records = await window.electronAPI.getOpenBorrowRecords(operator)
      setBorrowRecords(records)
      setNotice({ tone: 'info', text: `已查询到 ${records.length} 条未归还记录。` })
    } catch (error) {
      console.error(error)
      setNotice({ tone: 'error', text: `未归还记录查询失败：${getUserFacingErrorMessage(error)}` })
    } finally {
      setRecordsLoading(false)
    }
  }, [])

  const handleReturn = useCallback(async (record: BorrowRecord, quantity: number) => {
    if (!lastOperator) {
      setNotice({ tone: 'error', text: '请先完成人脸认证。' })
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
        cabinetNo: record.cabinetNo,
        slotNo: record.slotNo,
      })
      await refreshCatalog()
      setNotice({ tone: 'success', text: `${lastOperator.empName} 已归还：${record.itemName} x ${quantity}。` })
    } catch (error) {
      console.error(error)
      setNotice({ tone: 'error', text: `归还失败：${getUserFacingErrorMessage(error)}` })
    } finally {
      setOperating(false)
      returnHome()
    }
  }, [lastOperator, refreshCatalog, returnHome])

  const closeItemDialog = useCallback(() => {
    setItemDialog(null)
  }, [])

  const closeReturnDialog = useCallback(() => {
    setReturnVisible(false)
    setBorrowRecords([])
  }, [])

  return (
    <main className="digital-twin-shell">
      <ParticleField />
      <header className="twin-header">
        <div>
          <h1>行小助物品领用</h1>
        </div>
        <div className="twin-header-actions">
          <button type="button" className="twin-utility-button" disabled={refreshing} onClick={() => void refreshCatalog(true)}>
            {refreshing && <span className="terminal-button-spinner" />}
            {refreshing ? '同步中' : '刷新数据'}
          </button>
          <button type="button" className="twin-utility-button twin-return-button" onClick={openReturnDialog}>
            归还
          </button>
          <TerminalClock />
        </div>
      </header>

      {notice && (
        <div className={`terminal-notice terminal-notice-${notice.tone}`} role="status" aria-live="polite">
          <strong>{notice.tone === 'error' ? '操作未完成' : notice.tone === 'success' ? '操作完成' : '提示'}</strong>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="关闭提示">×</button>
        </div>
      )}

      <section className="terminal-stage">
        {screen === 'categories' && (
          <CategoryPage
            categories={categories}
            loading={categoriesLoading}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {screen === 'items' && (
          <ItemsPage
            items={items}
            loading={itemsLoading}
            selectedCategory={selectedCategory}
            onBack={showCategories}
            onSelectItem={setItemDialog}
          />
        )}
      </section>

      {itemDialog && (
        <ItemDialog
          item={itemDialog}
          operating={operating}
          onClose={closeItemDialog}
          onOperate={handleOperateItem}
        />
      )}

      {returnVisible && (
        <ReturnDialog
          records={borrowRecords}
          loading={recordsLoading}
          operating={operating}
          onClose={closeReturnDialog}
          onAuthenticated={loadBorrowRecords}
          onReturn={handleReturn}
        />
      )}
    </main>
  )
}
