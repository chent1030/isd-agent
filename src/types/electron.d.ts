export type CabinetSlotStatus = 'available' | 'low' | 'depleted' | 'empty' | 'fault'

export interface CabinetTwinSlot {
  cabinetNo: string
  slotNo: number
  itemId: string | null
  itemName: string
  category?: string
  spec?: string
  useType: number | null
  quantity: number
  minQuantity: number
  status: CabinetSlotStatus
}

export interface CabinetTwinCabinet {
  cabinetNo: string
  name: string
  columnCount: number
  rowCount: number
  slots: CabinetTwinSlot[]
}

export interface CabinetTwinData {
  cabinets: CabinetTwinCabinet[]
  updatedAt: string
}

export interface CabinetCategory {
  id: string
  name: string
  itemCount: number
}

export interface CabinetItemLocation {
  cabinetNo: string
  cabinetName?: string
  slotNo: number
  quantity: number
  enabled: boolean
  status: string
}

export interface CabinetCatalogItem {
  id: string
  name: string
  categoryId: string
  category: string
  spec?: string
  useType?: number
  stock: number
  cabinetQuantity: number
  restricted: boolean
  authorized: boolean
  authRequired: boolean
  borrowerReminderHours?: number
  adminReminderHours?: number
  locations: CabinetItemLocation[]
}

export interface BorrowRecord {
  id: string | number
  itemId: string | number
  itemName: string
  category?: string
  spec?: string
  cabinetName?: string
  cabinetNo?: string | number
  slotNo?: number
  quantity: number
  returnedQuantity: number
  pendingQuantity: number
  borrowTime?: string
  expectedReturnTime?: string
  remark?: string
}

export interface CabinetOperationPayload {
  action: 'receive' | 'borrow'
  itemId: string | number
  quantity: number
  operator: { empName: string; empWorkNo: string }
}

export interface CabinetItemOperationPayload {
  action: 'receive' | 'borrow'
  itemId: string | number
  quantity: number
  operator: { empName: string; empWorkNo: string }
}

export interface CabinetReturnPayload {
  borrowRecordId: string | number
  itemId: string | number
  quantity: number
  operator: { empName: string; empWorkNo: string }
  remark?: string
}

export interface ElectronAPI {
  recognizeFace: (imageBase64: string) => Promise<{ empName: string; empWorkNo: string } | null>
  getCabinetTwinData: (operator?: { empName: string; empWorkNo: string }) => Promise<CabinetTwinData>
  getCabinetCategories: () => Promise<CabinetCategory[]>
  getCabinetCatalogItems: (categoryId?: string) => Promise<CabinetCatalogItem[]>
  operateCabinetSlot: (payload: CabinetOperationPayload) => Promise<unknown>
  operateCabinetItem: (payload: CabinetItemOperationPayload) => Promise<unknown>
  getOpenBorrowRecords: (operator: { empName: string; empWorkNo: string }) => Promise<BorrowRecord[]>
  returnBorrowRecord: (payload: CabinetReturnPayload) => Promise<unknown>
  getAppConfig: () => Promise<{
    skipFaceAuth: boolean
    skipFaceAuthUser: { empName: string; empWorkNo: string }
    idleTimeoutMinutes: number
    idleTimeoutMs: number
  }>
  toggleFullScreen: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
