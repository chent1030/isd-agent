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

export interface CabinetCategory {
  id: string
  name: string
  itemCount: number
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

export type Operator = { empName: string; empWorkNo: string }
export type OperationMode = 'receive' | 'borrow'
export type FaceState = 'idle' | 'camera-loading' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'
export type AppScreen = 'categories' | 'items'
export type NoticeTone = 'success' | 'error' | 'info'

export interface AppConfig {
  skipFaceAuth: boolean
  skipFaceAuthUser: { empName: string; empWorkNo: string }
  idleTimeoutMinutes: number
  idleTimeoutMs: number
}

export interface CabinetOperationPayload {
  action: OperationMode
  itemId: string | number
  quantity: number
  operator: Operator
}

export interface CabinetReturnPayload {
  borrowRecordId: string | number
  itemId: string | number
  quantity: number
  operator: Operator
  remark?: string
  cabinetNo?: string | number
  slotNo?: number
}
