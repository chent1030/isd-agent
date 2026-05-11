<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-title">柜子总数</div>
            <div class="stat-value">{{ stats.cabinetCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-title">在库物品</div>
            <div class="stat-value">{{ stats.itemCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-title">今日称重</div>
            <div class="stat-value">{{ stats.weightCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-title">异常告警</div>
            <div class="stat-value" :class="{ 'text-danger': stats.abnormalCount > 0 }">
              {{ stats.abnormalCount }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近操作记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in recentLogs"
              :key="log.id"
              :timestamp="log.createdAt"
            >
              {{ log.operator }} - {{ log.action }}: {{ log.detail }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>柜子状态概览</span>
          </template>
          <el-table :data="cabinetList" border size="small">
            <el-table-column prop="id" label="柜号" width="100" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)" size="small">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCabinetList } from '../api/cabinet.js'
import { getLogList } from '../api/log.js'

const stats = ref({
  cabinetCount: 0,
  itemCount: 0,
  weightCount: 0,
  abnormalCount: 0
})

const recentLogs = ref([])
const cabinetList = ref([])

const fetchData = async () => {
  try {
    const [cabinetRes, logRes] = await Promise.all([
      getCabinetList(),
      getLogList({ page: 0, size: 5 })
    ])
    if (cabinetRes.code === 200) {
      cabinetList.value = cabinetRes.data || []
      stats.value.cabinetCount = cabinetList.value.length
      stats.value.abnormalCount = cabinetList.value.filter(item => item.status !== 1).length
    }
    if (logRes.code === 200) {
      recentLogs.value = logRes.data || []
    }
  } catch (error) {
    console.error(error)
  }
}

const statusText = (status) => {
  const map = { 0: '停用', 1: '启用', 2: '维护中' }
  return map[status] || '未知'
}

const statusTag = (status) => {
  const map = { 0: 'danger', 1: 'success', 2: 'warning' }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stat-item {
  text-align: center;
}
.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}
.text-danger {
  color: #f56c6c;
}
</style>
