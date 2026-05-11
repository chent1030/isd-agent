<template>
  <div class="weight-data">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>称重数据</span>
          <el-button type="primary" size="small" @click="handleExport" :disabled="!queryForm.cabinetId">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </div>
      </template>
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="柜号">
          <el-select v-model="queryForm.cabinetId" placeholder="请选择柜号" clearable style="width: 160px">
            <el-option
              v-for="item in cabinetOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="cabinetId" label="柜号" width="120" />
        <el-table-column prop="slotId" label="格口ID" width="100" />
        <el-table-column prop="weight" label="重量(g)" width="120" />
        <el-table-column prop="changeAmount" label="变化量(g)" width="120" />
        <el-table-column prop="eventType" label="事件类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.eventType === 0 ? 'info' : row.eventType === 1 ? 'success' : 'danger'">
              {{ eventTypeText(row.eventType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recordedAt" label="记录时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getWeightList, exportWeight } from '../api/weight.js'
import { getCabinetList } from '../api/cabinet.js'

const loading = ref(false)
const tableData = ref([])
const cabinetOptions = ref([])

const queryForm = ref({
  cabinetId: ''
})

const fetchCabinetOptions = async () => {
  try {
    const res = await getCabinetList()
    if (res.code === 200) {
      cabinetOptions.value = (res.data || []).map(item => ({
        value: item.id,
        label: `${item.name} (${item.id})`
      }))
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchData = async () => {
  if (!queryForm.value.cabinetId) return
  loading.value = true
  try {
    const res = await getWeightList(queryForm.value.cabinetId)
    tableData.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  fetchData()
}

const handleExport = async () => {
  if (!queryForm.value.cabinetId) {
    ElMessage.warning('请先选择柜号')
    return
  }
  try {
    const res = await exportWeight(queryForm.value.cabinetId)
    downloadBlob(res, '称重记录_' + queryForm.value.cabinetId + '_' + new Date().toLocaleDateString() + '.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  }
}

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const eventTypeText = (type) => {
  const map = { 0: '定时上报', 1: '增重', 2: '减重' }
  return map[type] || '未知'
}

onMounted(() => {
  fetchCabinetOptions()
})
</script>

<style scoped>
.query-form {
  margin-bottom: 20px;
}
</style>
