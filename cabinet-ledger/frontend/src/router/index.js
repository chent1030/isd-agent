import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../views/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, title: '登录' }
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
        meta: { title: '首页' }
      },
      {
        path: 'cabinets',
        name: 'CabinetList',
        component: () => import('../views/cabinet/CabinetList.vue'),
        meta: { title: '柜子管理' }
      },
      {
        path: 'cabinet/:id',
        name: 'CabinetDetail',
        component: () => import('../views/cabinet/CabinetDetail.vue'),
        meta: { title: '柜子详情' }
      },
      {
        path: 'ledger',
        name: 'LedgerList',
        component: () => import('../views/ledger/LedgerList.vue'),
        meta: { title: '物品台账' }
      },
      {
        path: 'inventory-check',
        name: 'InventoryCheck',
        component: () => import('../views/InventoryCheck.vue'),
        meta: { title: '库存盘点' }
      },
      {
        path: 'borrow-records',
        name: 'BorrowRecords',
        component: () => import('../views/BorrowRecords.vue'),
        meta: { title: '借用记录' }
      },
      {
        path: 'weight-data',
        name: 'WeightData',
        component: () => import('../views/WeightData.vue'),
        meta: { title: '称重数据' }
      },
      {
        path: 'operation-log',
        name: 'OperationLog',
        component: () => import('../views/OperationLog.vue'),
        meta: { title: '操作日志' }
      },
      {
        path: 'admin-users',
        name: 'AdminUserManage',
        component: () => import('../views/AdminUserManage.vue'),
        meta: { title: '账号管理' }
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
