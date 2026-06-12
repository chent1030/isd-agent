import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../views/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, title: '鐧诲綍' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '棣栭〉' }
      },
      {
        path: 'cabinets',
        name: 'CabinetList',
        component: () => import('../views/cabinet/CabinetList.vue'),
        meta: { title: '鏌滃瓙绠＄悊' }
      },
      {
        path: 'cabinet/:id',
        name: 'CabinetDetail',
        component: () => import('../views/cabinet/CabinetDetail.vue'),
        meta: { title: '鏌滃瓙璇︽儏' }
      },
      {
        path: 'ledger',
        name: 'LedgerList',
        component: () => import('../views/ledger/LedgerList.vue'),
        meta: { title: '鐗╁搧鍙拌处' }
      },
      {
        path: 'item-auth',
        name: 'ItemAuthorization',
        component: () => import('../views/ItemAuthorization.vue'),
        meta: { title: '物品授权' }
      },
      {
        path: 'inventory-check',
        name: 'InventoryCheck',
        component: () => import('../views/InventoryCheck.vue'),
        meta: { title: '搴撳瓨鐩樼偣' }
      },
      {
        path: 'borrow-records',
        name: 'BorrowRecords',
        component: () => import('../views/BorrowRecords.vue'),
        meta: { title: '鍊熺敤璁板綍' }
      },
      {
        path: 'weight-data',
        name: 'WeightData',
        component: () => import('../views/WeightData.vue'),
        meta: { title: '绉伴噸鏁版嵁' }
      },
      {
        path: 'operation-log',
        name: 'OperationLog',
        component: () => import('../views/OperationLog.vue'),
        meta: { title: '鎿嶄綔鏃ュ織' }
      },
      {
        path: 'admin-users',
        name: 'AdminUserManage',
        component: () => import('../views/AdminUserManage.vue'),
        meta: { title: '璐﹀彿绠＄悊' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta?.public) {
    return true
  }
  const user = localStorage.getItem('cabinet-ledger-user')
  if (!user) {
    return '/login'
  }
  return true
})

export default router
