<template>
  <div class="operation-log">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="柜号">
          <el-input v-model="queryForm.cabinetId" placeholder="请输入柜号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="queryForm.operator" placeholder="请输入操作人" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="cabinetId" label="柜号" width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="action" label="操作类型" width="120" />
        <el-table-column prop="detail" label="详情" />
        <el-table-column prop="ipAddr" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="160" />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLogList } from '../api/log.js'

const loading = ref(false)
const tableData = ref([])

const queryForm = ref({
  cabinetId: '',
  operator: ''
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryForm.value,
      page: pagination.value.page,
      size: pagination.value.pageSize
    }
    const res = await getLogList(params)
    tableData.value = res.content || []
    pagination.value.total = res.totalElements || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  pagination.value.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.value = {
    cabinetId: '',
    operator: ''
  }
  pagination.value.page = 1
  fetchData()
}

const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.value.page = val
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.query-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
