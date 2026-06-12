<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">行小助物品领用</div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>棣栭〉</span>
        </el-menu-item>
        <el-menu-item index="/cabinets">
          <el-icon><Box /></el-icon>
          <span>鏌滃瓙绠＄悊</span>
        </el-menu-item>
        <el-menu-item index="/ledger">
          <el-icon><Document /></el-icon>
          <span>鐗╁搧鍙拌处</span>
        </el-menu-item>
        <el-menu-item index="/item-auth">
          <el-icon><User /></el-icon>
          <span>物品授权</span>
        </el-menu-item>
        <el-menu-item index="/inventory-check">
          <el-icon><Checked /></el-icon>
          <span>搴撳瓨鐩樼偣</span>
        </el-menu-item>
        <el-menu-item index="/borrow-records">
          <el-icon><Tickets /></el-icon>
          <span>鍊熺敤璁板綍</span>
        </el-menu-item>
        <el-menu-item index="/weight-data">
          <el-icon><ScaleToOriginal /></el-icon>
          <span>绉伴噸鏁版嵁</span>
        </el-menu-item>
        <el-menu-item index="/operation-log">
          <el-icon><List /></el-icon>
          <span>鎿嶄綔鏃ュ織</span>
        </el-menu-item>
        <el-menu-item index="/admin-users">
          <el-icon><User /></el-icon>
          <span>璐﹀彿绠＄悊</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="header-title">{{ pageTitle }}</span>
        <div class="header-user">
          <span>{{ currentUser?.displayName || currentUser?.username }}</span>
          <el-button size="small" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentUser = computed(() => {
  const text = localStorage.getItem('cabinet-ledger-user')
  return text ? JSON.parse(text) : null
})

const activeMenu = computed(() => {
  if (route.path.startsWith('/cabinet/')) {
    return '/cabinets'
  }
  return route.path
})

const pageTitle = computed(() => {
  return route.meta?.title || ''
})

const logout = () => {
  localStorage.removeItem('cabinet-ledger-user')
  router.replace('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.menu {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
