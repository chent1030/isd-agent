import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { getUserFacingErrorMessage } from '@/lib/error'
import { AppHeader } from '@/components/terminal/AppHeader'
import { CategoryGrid } from '@/components/terminal/CategoryGrid'
import { ItemGrid } from '@/components/terminal/ItemGrid'
import { ItemDialog } from '@/components/terminal/ItemDialog'
import { ReturnDialog } from '@/components/terminal/ReturnDialog'
import type { AppScreen, BorrowRecord, CabinetCatalogItem, CabinetCategory, OperationMode, Operator } from '@/types/api'

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('categories')
  const [categories, setCategories] = useState<CabinetCategory[]>([])
  const [items, setItems] = useState<CabinetCatalogItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [itemDialog, setItemDialog] = useState<CabinetCatalogItem | null>(null)
  const [operating, setOperating] = useState(false)
  const [returnVisible, setReturnVisible] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [lastOperator, setLastOperator] = useState<Operator | null>(null)
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(DEFAULT_IDLE_TIMEOUT_MS)
  const lastActivityAtRef = useRef(Date.now())

  const selectedCategory = useMemo(
    () => categories.find(category => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  )

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const next = await api.getCategories()
      setCategories(next)
    } catch (error) {
      toast.error(`类别加载失败：${getUserFacingErrorMessage(error)}`)
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
      const next = await api.getCatalogItems(categoryId)
      setItems(next)
    } catch (error) {
      toast.error(`物品加载失败：${getUserFacingErrorMessage(error)}`)
      setItems([])
    } finally {
      setItemsLoading(false)
    }
  }, [])

  const refreshCatalog = useCallback(async (showButtonLoading = false) => {
    if (showButtonLoading) setRefreshing(true)
    try {
      const nextCategories = await api.getCategories()
      setCategories(nextCategories)
      if (screen === 'items' && selectedCategoryId) {
        const nextItems = await api.getCatalogItems(selectedCategoryId)
        setItems(nextItems)
      }
    } catch (error) {
      toast.error(`数据刷新失败：${getUserFacingErrorMessage(error)}`)
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
    api.getAppConfig()
      .then(config => {
        if (!cancelled && Number.isFinite(config.idleTimeoutMs) && config.idleTimeoutMs > 0) {
          setIdleTimeoutMs(config.idleTimeoutMs)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setItems([])
    setScreen('items')
  }, [])

  const returnHome = useCallback(() => {
    setScreen('categories')
  }, [])

  const isAwayFromHome = screen === 'items'

  useEffect(() => {
    const updateActivity = () => {
      lastActivityAtRef.current = Date.now()
    }
    const events = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'wheel']
    events.forEach(name => window.addEventListener(name, updateActivity, { passive: true }))
    updateActivity()
    return () => events.forEach(name => window.removeEventListener(name, updateActivity))
  }, [])

  useEffect(() => {
    if (!isAwayFromHome) {
      lastActivityAtRef.current = Date.now()
      return
    }
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityAtRef.current < idleTimeoutMs) return
      toast.info('长时间未操作，已返回首页。')
      returnHome()
      lastActivityAtRef.current = Date.now()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [idleTimeoutMs, isAwayFromHome, returnHome])

  const handleSelectItem = useCallback((item: CabinetCatalogItem) => {
    setItemDialog(item)
  }, [])

  const handleOperateItem = useCallback(async (item: CabinetCatalogItem, mode: OperationMode, quantity: number, operator: Operator) => {
    setOperating(true)
    try {
      const result = await api.operateItem({ action: mode, itemId: item.id, quantity, operator })
      const openedCount = Array.isArray(result?.locations) ? result.locations.length : 0
      await refreshCatalog()
      toast.success(`${operator.empName} 已完成${mode === 'receive' ? '领用' : '借用'}：${item.name} x ${quantity}${openedCount ? `，已打开 ${openedCount} 个格口` : ''}`)
    } catch (error) {
      toast.error(`${mode === 'receive' ? '领用' : '借用'}失败：${getUserFacingErrorMessage(error)}`)
    } finally {
      setOperating(false)
      setItemDialog(null)
    }
  }, [refreshCatalog])

  const loadBorrowRecords = useCallback(async (operator: Operator) => {
    setRecordsLoading(true)
    setLastOperator(operator)
    try {
      const records = await api.getBorrowRecords(operator)
      setBorrowRecords(records)
      if (records.length > 0) {
        toast.info(`已查询到 ${records.length} 条未归还记录。`)
      }
    } catch (error) {
      toast.error(`未归还记录查询失败：${getUserFacingErrorMessage(error)}`)
    } finally {
      setRecordsLoading(false)
    }
  }, [])

  const handleReturn = useCallback(async (record: BorrowRecord, quantity: number) => {
    if (!lastOperator) {
      toast.error('请先完成人脸认证。')
      setReturnVisible(false)
      return
    }
    setOperating(true)
    try {
      await api.returnRecord({
        borrowRecordId: record.id,
        itemId: record.itemId,
        quantity,
        operator: lastOperator,
        remark: `终端归还：${lastOperator.empName}`,
        cabinetNo: record.cabinetNo,
        slotNo: record.slotNo,
      })
      await refreshCatalog()
      toast.success(`${lastOperator.empName} 已归还：${record.itemName} x ${quantity}`)
    } catch (error) {
      toast.error(`归还失败：${getUserFacingErrorMessage(error)}`)
    } finally {
      setOperating(false)
      setReturnVisible(false)
    }
  }, [lastOperator, refreshCatalog])

  const openReturn = useCallback(() => {
    setReturnVisible(true)
    setBorrowRecords([])
    setLastOperator(null)
  }, [])

  const closeReturnDialog = useCallback(() => {
    setReturnVisible(false)
    setBorrowRecords([])
  }, [])

  return (
    <main className="terminal-surface flex h-screen flex-col gap-4 overflow-hidden p-4">
      <AppHeader refreshing={refreshing} onRefresh={() => void refreshCatalog(true)} onReturn={openReturn} />

      <section className="terminal-panel min-h-0 flex-1 overflow-hidden rounded-lg p-5">
        {screen === 'categories' && (
          <CategoryGrid categories={categories} loading={categoriesLoading} onSelect={handleSelectCategory} />
        )}
        {screen === 'items' && (
          <ItemGrid
            items={items}
            loading={itemsLoading}
            selectedCategory={selectedCategory}
            onBack={() => setScreen('categories')}
            onSelect={handleSelectItem}
          />
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
          onClose={closeReturnDialog}
          onAuthenticated={loadBorrowRecords}
          onReturn={handleReturn}
        />
      )}
    </main>
  )
}
