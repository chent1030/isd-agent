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
  operateCabinetSlot: (payload: CabinetOperationPayload) => Promise<unknown>
  getOpenBorrowRecords: (operator: { empName: string; empWorkNo: string }) => Promise<BorrowRecord[]>
  returnBorrowRecord: (payload: CabinetReturnPayload) => Promise<unknown>
  getAppConfig: () => Promise<{
    skipFaceAuth: boolean
    skipFaceAuthUser: { empName: string; empWorkNo: string }
  }>
  toggleFullScreen: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
