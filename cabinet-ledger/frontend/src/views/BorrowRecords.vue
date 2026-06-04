<template>
  <div class="borrow-records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>借用记录</span>
          <el-button type="primary" size="small" @click="openBorrowDialog()">
            新增借用
          </el-button>
        </div>
      </template>

      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" clearable placeholder="请选择状态" style="width: 150px">
            <el-option label="借用中" :value="0" />
            <el-option label="已归还" :value="1" />
            <el-option label="部分归还" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="物品">
          <el-select v-model="queryForm.itemId" filterable clearable placeholder="请选择物品" style="width: 220px">
            <el-option
              v-for="item in borrowableItems"
              :key="item.id"
              :label="formatItemLabel(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="借用人">
          <el-input v-model="queryForm.borrower" clearable placeholder="请输入借用人" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border v-loading="loading">
        <el-table-column prop="itemName" label="物品名称" min-width="140" />
        <el-table-column prop="category" label="类别" width="110" />
        <el-table-column prop="spec" label="规格" width="130" />
        <el-table-column prop="cabinetName" label="柜子名称" width="140" />
        <el-table-column prop="slotNo" label="格口号" width="90" />
        <el-table-column prop="quantity" label="借用数量" width="90" />
        <el-table-column prop="returnedQuantity" label="已归还" width="90" />
        <el-table-column prop="pendingQuantity" label="未归还" width="90" />
        <el-table-column prop="borrower" label="借用人" width="120" />
        <el-table-column prop="borrowOperatorNo" label="借出工号" width="120" />
        <el-table-column prop="borrowOperatorName" label="借出姓名" width="120" />
        <el-table-column prop="returnOperatorNo" label="归还工号" width="120" />
        <el-table-column prop="returnOperatorName" label="归还姓名" width="120" />
        <el-table-column prop="borrowTime" label="借用时间" width="170" />
        <el-table-column prop="expectedReturnTime" label="预计归还" width="170" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              :disabled="row.pendingQuantity <= 0"
              @click="openReturnDialog(row)"
            >
              归还
            </el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="borrowDialogVisible" title="新增借用" width="560px">
      <el-form :model="borrowForm" label-width="110px">
        <el-form-item label="物品">
          <el-select v-model="borrowForm.itemId" filterable placeholder="请选择物品" style="width: 360px">
            <el-option
              v-for="item in borrowableItems"
              :key="item.id"
              :label="formatItemLabel(item)"
              :value="item.id"
              :disabled="item.quantity <= 0"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="borrowForm.quantity" :precision="0" :step="1" :min="1" />
        </el-form-item>
        <el-form-item label="借用人">
          <el-input v-model="borrowForm.borrower" />
        </el-form-item>
        <el-form-item label="操作人工号">
          <el-input v-model="borrowForm.operatorNo" />
        </el-form-item>
        <el-form-item label="操作人姓名">
          <el-input v-model="borrowForm.operatorName" />
        </el-form-item>
        <el-form-item label="预计归还">
          <el-date-picker
            v-model="borrowForm.expectedReturnTime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="请选择时间"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="borrowForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBorrow">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="归还物品" width="520px">
      <el-form :model="returnForm" label-width="110px">
        <el-form-item label="物品">
          <el-input :model-value="returnForm.itemName" disabled />
        </el-form-item>
        <el-form-item label="未归还">
          <el-input-number :model-value="returnForm.pendingQuantity" disabled />
        </el-form-item>
        <el-form-item label="归还数量">
          <el-input-number
            v-model="returnForm.quantity"
            :precision="0"
            :step="1"
            :min="1"
            :max="returnForm.pendingQuantity || 1"
          />
        </el-form-item>
        <el-form-item label="操作人工号">
          <el-input v-model="returnForm.operatorNo" />
        </el-form-item>
        <el-form-item label="操作人姓名">
          <el-input v-model="returnForm.operatorName" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="returnForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReturn">确认归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { borrowItem, getBorrowRecordList, returnItem } from '../api/borrow.js'
import { getItemList } from '../api/item.js'

const loading = ref(false)
const tableData = ref([])
const itemOptions = ref([])
const borrowDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const borrowForm = ref({})
const returnForm = ref({})

const queryForm = ref({
  status: null,
  itemId: null,
  borrower: ''
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const borrowableItems = computed(() => {
  return itemOptions.value.filter(item => item.useType === 1 || item.useType === 2)
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getBorrowRecordList({
      ...queryForm.value,
      page: pagination.value.page,
      size: pagination.value.pageSize
    })
    tableData.value = res.content || []
    pagination.value.total = res.totalElements || 0
  } finally {
    loading.value = false
  }
}

const fetchItems = async () => {
  const res = await getItemList()
  itemOptions.value = res.data || []
}

const handleQuery = () => {
  pagination.value.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.value = { status: null, itemId: null, borrower: '' }
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

const openBorrowDialog = () => {
  borrowForm.value = {
    itemId: null,
    quantity: 1,
    borrower: '',
    operatorNo: '',
    operatorName: '',
    expectedReturnTime: null,
    remark: ''
  }
  borrowDialogVisible.value = true
}

const handleBorrow = async () => {
  const res = await borrowItem(borrowForm.value)
  if (res) {
    ElMessage.success('借用成功')
    borrowDialogVisible.value = false
    fetchItems()
    fetchData()
  }
}

const openReturnDialog = (row) => {
  returnForm.value = {
    borrowRecordId: row.id,
    itemName: row.itemName,
    pendingQuantity: row.pendingQuantity,
    quantity: row.pendingQuantity || 1,
    operatorNo: '',
    operatorName: '',
    remark: row.remark || ''
  }
  returnDialogVisible.value = true
}

const handleReturn = async () => {
  const res = await returnItem(returnForm.value)
  if (res) {
    ElMessage.success('归还成功')
    returnDialogVisible.value = false
    fetchItems()
    fetchData()
  }
}

const formatItemLabel = (item) => {
  const stock = item.quantity ?? 0
  const cabinet = item.cabinetName ? ` / ${item.cabinetName}` : ''
  const slot = item.slotNo ? ` / ${item.slotNo}号格口` : ''
  return `${item.name}${cabinet}${slot} / 可用 ${stock}`
}

const statusText = (status) => {
  return ({ 0: '借用中', 1: '已归还', 2: '部分归还' })[status] || '未知'
}

const statusTag = (status) => {
  return ({ 0: 'warning', 1: 'success', 2: 'primary' })[status] || 'info'
}

onMounted(() => {
  fetchItems()
  fetchData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.query-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
