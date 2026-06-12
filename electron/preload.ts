import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 人脸识别
  recognizeFace: (imageBase64: string) =>
    ipcRenderer.invoke('face:recognize', imageBase64),

  getCabinetTwinData: (operator?: object) =>
    ipcRenderer.invoke('cabinet:twin-data', { operator }),
  getCabinetCategories: () =>
    ipcRenderer.invoke('cabinet:categories'),
  getCabinetCatalogItems: (categoryId?: string) =>
    ipcRenderer.invoke('cabinet:catalog-items', { categoryId }),
  operateCabinetSlot: (payload: object) =>
    ipcRenderer.invoke('cabinet:operate-slot', payload),
  operateCabinetItem: (payload: object) =>
    ipcRenderer.invoke('cabinet:operate-item', payload),
  getOpenBorrowRecords: (operator: object) =>
    ipcRenderer.invoke('cabinet:open-borrow-records', { operator }),
  returnBorrowRecord: (payload: object) =>
    ipcRenderer.invoke('cabinet:return-record', payload),
  getAppConfig: () => ipcRenderer.invoke('app:get-config'),

  // 窗口控制
  toggleFullScreen: () => ipcRenderer.send('window:toggle-fullscreen'),
})
