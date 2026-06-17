export type Operator = { empName: string; empWorkNo: string }
export type OperationMode = 'receive' | 'borrow'
export type FaceState = 'idle' | 'camera-loading' | 'camera' | 'recognizing' | 'success' | 'failed' | 'unmatched'
export type AppScreen = 'categories' | 'items'
export type NoticeTone = 'success' | 'error' | 'info'
export type AppNotice = { tone: NoticeTone; text: string }
