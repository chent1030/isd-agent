<template>
  <div class="cabinet-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>柜子列表</span>
          <div>
            <el-button type="primary" size="small" @click="openDialog()">
              新增柜子
            </el-button>
            <el-button type="primary" size="small" @click="handleExport">
              <el-icon><Download /></el-icon>导出
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="cabinetNo" label="柜号" width="100" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goDetail(row.id)">
              详情
            </el-button>
            <el-button size="small" :disabled="row.status === 1" @click="openDialog(row)">
              编辑
            </el-button>
            <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" :disabled="row.status === 1" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑柜子' : '新增柜子'" width="560px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="ID">
          <el-input v-model="form.id" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="柜号">
          <el-input-number v-model="form.cabinetNo" :precision="0" :step="1" :min="1" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px">
            <el-option label="停用" :value="0" />
            <el-option label="启用" :value="1" />
            <el-option label="维护中" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getCabinetList, saveCabinet, updateCabinetStatus, deleteCabinet, exportCabinet } from '../../api/cabinet.js'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref('')
const form = ref({})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCabinetList()
    tableData.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goDetail = (id) => {
  router.push(`/cabinet/${id}`)
}

const openDialog = (row) => {
  if (row?.status === 1) {
    ElMessage.warning('启用中的柜子不能编辑，请先停用')
    return
  }
  editingId.value = row?.id || ''
  form.value = row
    ? { ...row }
    : { id: '', cabinetNo: null, name: '', location: '', status: 0 }
  dialogVisible.value = true
}

const handleSave = async () => {
  const res = await saveCabinet(form.value)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchData()
  }
}

const toggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1
  const res = await updateCabinetStatus(row.id, nextStatus)
  if (res.code === 200) {
    ElMessage.success(nextStatus === 1 ? '已启用' : '已停用')
    fetchData()
  }
}

const handleDelete = async (row) => {
  if (row.status === 1) {
    ElMessage.warning('启用中的柜子不能删除，请先停用')
    return
  }
  await ElMessageBox.confirm(`确认删除柜子「${row.name}(${row.cabinetNo})」？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  const res = await deleteCabinet(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    fetchData()
  }
}

const handleExport = async () => {
  try {
    const res = await exportCabinet()
    downloadBlob(res, '柜子列表_' + new Date().toLocaleDateString() + '.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>
