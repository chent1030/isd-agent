<template>
  <div class="item-auth">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物品授权</span>
          <el-button type="primary" size="small" @click="openDialog()">新增授权</el-button>
        </div>
      </template>

      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="物品">
          <el-select v-model="queryForm.itemId" clearable filterable placeholder="请选择物品" style="width: 220px">
            <el-option v-for="item in itemOptions" :key="item.id" :label="itemLabel(item)" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="queryForm.employeeNo" clearable placeholder="请输入工号" style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAuthList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="authData" border v-loading="loading">
        <el-table-column prop="itemName" label="物品" min-width="160" />
        <el-table-column prop="employeeNo" label="工号" width="140" />
        <el-table-column prop="employeeName" label="姓名" width="140" />
        <el-table-column prop="validFrom" label="开始时间" width="180" />
        <el-table-column prop="validTo" label="结束时间" width="180">
          <template #default="{ row }">{{ row.validTo || '长期有效' }}</template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="物品授权" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="物品">
          <el-select v-model="form.itemId" filterable placeholder="请选择物品" style="width: 360px">
            <el-option v-for="item in itemOptions" :key="item.id" :label="itemLabel(item)" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="form.employeeNo" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.employeeName" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-select v-model="periodPreset" style="width: 180px" @change="applyPreset">
            <el-option label="当天有效" value="today" />
            <el-option label="7天有效" value="7days" />
            <el-option label="1个月有效" value="1month" />
            <el-option label="长期有效" value="long" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.validFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
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
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteItemAuth, getItemAuthList, getItemList, saveItemAuth } from '../api/item.js'

const loading = ref(false)
const authData = ref([])
const itemOptions = ref([])
const dialogVisible = ref(false)
const periodPreset = ref('today')
const queryForm = ref({ itemId: null, employeeNo: '' })
const form = ref({})

const itemLabel = (item) => {
  const spec = item.spec ? ` / ${item.spec}` : ''
  return `${item.name}${spec}`
}

const fetchItems = async () => {
  itemOptions.value = await getItemList() || []
}

const fetchAuthList = async () => {
  loading.value = true
  try {
    authData.value = await getItemAuthList(queryForm.value) || []
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryForm.value = { itemId: null, employeeNo: '' }
  fetchAuthList()
}

const openDialog = (row) => {
  form.value = row
    ? { ...row }
    : { itemId: null, employeeNo: '', employeeName: '', validFrom: '', validTo: '', enabled: 1, remark: '' }
  periodPreset.value = row ? 'custom' : 'today'
  if (!row) applyPreset('today')
  dialogVisible.value = true
}

const toLocalValue = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const applyPreset = (preset = periodPreset.value) => {
  const now = new Date()
  const start = new Date(now)
  let end = null
  if (preset === 'today') {
    end = new Date(now)
    end.setHours(23, 59, 59, 0)
  } else if (preset === '7days') {
    end = new Date(now)
    end.setDate(end.getDate() + 7)
  } else if (preset === '1month') {
    end = new Date(now)
    end.setMonth(end.getMonth() + 1)
  } else if (preset === 'long') {
    end = null
  } else {
    return
  }
  form.value.validFrom = toLocalValue(start)
  form.value.validTo = end ? toLocalValue(end) : ''
}

const handleSave = async () => {
  const res = await saveItemAuth(form.value)
  if (res) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchAuthList()
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确认删除该授权？', '提示', { type: 'warning' })
  const res = await deleteItemAuth(row.id)
  if (res) {
    ElMessage.success('删除成功')
    fetchAuthList()
  }
}

onMounted(async () => {
  await fetchItems()
  fetchAuthList()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form {
  margin-bottom: 20px;
}
</style>
