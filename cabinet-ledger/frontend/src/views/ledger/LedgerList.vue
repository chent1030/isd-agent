<template>
  <div class="ledger-list">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="鍙拌处璁板綍" name="ledger">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>鍙拌处璁板綍</span>
              <div>
                <el-button type="primary" size="small" @click="handleExport">
                  <el-icon><Download /></el-icon>瀵煎嚭
                </el-button>
              </div>
            </div>
          </template>
          <el-form :model="queryForm" inline class="query-form">
            <el-form-item label="鏌滃彿">
              <el-select v-model="queryForm.cabinetId" placeholder="璇烽€夋嫨鏌滃彿" clearable style="width: 160px">
                <el-option
                  v-for="item in cabinetOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="鎿嶄綔绫诲瀷">
              <el-select v-model="queryForm.operationType" placeholder="璇烽€夋嫨绫诲瀷" clearable style="width: 160px">
                <el-option label="鍏ュ簱" :value="0" />
                <el-option label="棰嗙敤" :value="1" />
                <el-option label="鍊熺敤" :value="2" />
                <el-option label="褰掕繕" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryForm.status" placeholder="请选择状态" clearable style="width: 160px">
                <el-option label="鍦ㄥ簱" :value="0" />
                <el-option label="已取出" :value="1" />
                <el-option label="寮傚父" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="绫诲埆">
              <el-input v-model="queryForm.category" placeholder="请输入类别" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">
                <el-icon><Search /></el-icon>鏌ヨ
              </el-button>
              <el-button @click="handleReset">閲嶇疆</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="ledgerData" v-loading="ledgerLoading" border>
            <el-table-column prop="itemName" label="鐗╁搧鍚嶇О" />
            <el-table-column prop="category" label="绫诲埆" width="120" />
            <el-table-column prop="spec" label="瑙勬牸" width="120" />
            <el-table-column prop="slotNo" label="鏍煎彛" width="100" />
            <el-table-column prop="quantity" label="鏁伴噺" width="80" />
            <el-table-column prop="totalWeight" label="閲嶉噺(g)" width="100" />
            <el-table-column prop="operationType" label="鎿嶄綔绫诲瀷" width="100">
              <template #default="{ row }">
                <el-tag :type="operationTypeTag(row.operationType)">
                  {{ operationTypeText(row.operationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorNo" label="操作人工号" width="120" />
            <el-table-column prop="operatorName" label="操作人姓名" width="120" />
            <el-table-column prop="storedAt" label="鎿嶄綔鏃堕棿" width="160" />
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
      </el-tab-pane>

      <el-tab-pane label="鐗╁搧鍩虹淇℃伅" name="items">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>鐗╁搧鍩虹淇℃伅</span>
              <div>
                <el-button type="warning" size="small" @click="openStockReminderDialog">
                  库存提醒
                </el-button>
                <el-button type="success" size="small" @click="handleItemImport">
                  <el-icon><Upload /></el-icon>瀵煎叆
                </el-button>
                <el-button size="small" @click="handleItemTemplateExport">
                  <el-icon><Download /></el-icon>瀵煎叆妯℃澘
                </el-button>
                <el-button type="primary" size="small" @click="handleItemExport">
                  <el-icon><Download /></el-icon>瀵煎嚭
                </el-button>
                <el-button type="primary" size="small" @click="openItemDialog()">鏂板鐗╁搧</el-button>
              </div>
            </div>
          </template>

          <el-table :data="itemData" border v-loading="itemLoading">
            <el-table-column prop="name" label="鐗╁搧鍚嶇О" />
            <el-table-column prop="category" label="绫诲埆" width="120" />
            <el-table-column prop="spec" label="瑙勬牸" width="160" />
            <el-table-column prop="standardWeight" label="鏍囧噯閲嶉噺(g)" width="140" />
            <el-table-column prop="useType" label="浣跨敤绫诲瀷" width="110">
              <template #default="{ row }">
                {{ useTypeText(row.useType) }}
              </template>
            </el-table-column>
            <el-table-column prop="authRequired" label="授权" width="90">
              <template #default="{ row }">
                <el-tag :type="row.authRequired ? 'warning' : 'info'">{{ row.authRequired ? '需要' : '不需要' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="物品库存" width="100" />
            <el-table-column prop="slotQuantity" label="格口数量" width="100" />
            <el-table-column prop="borrowedQuantity" label="外借数量" width="100" />
            <el-table-column prop="borrowerReminderHours" label="借用人提醒(h)" width="130" />
            <el-table-column prop="adminReminderHours" label="管理员提醒(h)" width="130" />
            <el-table-column prop="warningQuantity" label="棰勮鏁伴噺" width="100" />
            <el-table-column prop="maxQuantity" label="最大库存" width="100" />
            <el-table-column prop="cabinetName" label="鏌滃瓙鍚嶇О" width="140" />
            <el-table-column prop="slotNo" label="格口号" width="90" />
            <el-table-column prop="stockStatus" label="库存状态" width="100">
              <template #default="{ row }">
                <el-tag :type="stockStatusTag(row.stockStatus)">
                  {{ stockStatusText(row.stockStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="鏇存柊鏃堕棿" width="170" />
            <el-table-column label="鎿嶄綔" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="openItemDialog(row)">缂栬緫</el-button>
                <el-button size="small" type="primary" @click="openStockDialog(row)">搴撳瓨</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="itemDialogVisible" title="鐗╁搧淇℃伅" width="520px">
      <el-form :model="itemForm" label-width="110px">
        <el-form-item label="鍚嶇О">
          <el-input v-model="itemForm.name" />
        </el-form-item>
        <el-form-item label="绫诲埆">
          <el-input v-model="itemForm.category" />
        </el-form-item>
        <el-form-item label="瑙勬牸">
          <el-input v-model="itemForm.spec" />
        </el-form-item>
        <el-form-item label="鏍囧噯閲嶉噺">
          <el-input-number v-model="itemForm.standardWeight" :precision="0" :step="1" :min="0" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="浣跨敤绫诲瀷">
          <el-select v-model="itemForm.useType" style="width: 220px">
            <el-option label="棰嗙敤" :value="0" />
            <el-option label="鍊熺敤" :value="1" />
            <el-option label="棰嗙敤/鍊熺敤" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="棰勮鏁伴噺">
          <el-input-number v-model="itemForm.warningQuantity" :precision="0" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="领用授权">
          <el-switch
            v-model="itemForm.authRequired"
            :active-value="1"
            :inactive-value="0"
            active-text="需要"
            inactive-text="不需要"
          />
        </el-form-item>
        <el-form-item label="最大库存">
          <el-input-number v-model="itemForm.maxQuantity" :precision="0" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="借用人提醒">
          <el-input-number v-model="itemForm.borrowerReminderHours" :precision="0" :step="1" :min="0" />
          <span class="unit">小时</span>
        </el-form-item>
        <el-form-item label="管理员提醒">
          <el-input-number v-model="itemForm.adminReminderHours" :precision="0" :step="1" :min="0" />
          <span class="unit">小时</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">鍙栨秷</el-button>
        <el-button type="primary" @click="handleSaveItem">淇濆瓨</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockDialogVisible" title="搴撳瓨淇" width="520px">
      <el-form :model="stockForm" label-width="120px">
        <el-form-item label="鐗╁搧">
          <el-input :model-value="stockForm.name" disabled />
        </el-form-item>
        <el-form-item label="褰撳墠搴撳瓨">
          <el-input-number v-model="stockForm.quantity" :precision="0" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="外借数量">
          <el-input-number v-model="stockForm.borrowedQuantity" :precision="0" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="鍙拌处閲嶉噺">
          <el-input-number v-model="stockForm.ledgerWeight" :precision="0" :step="1" :min="0" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="瀹為檯閲嶉噺">
          <el-input-number v-model="stockForm.actualWeight" :precision="0" :step="1" :min="0" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="棰勮鏁伴噺">
          <el-input-number v-model="stockForm.warningQuantity" :precision="0" :step="1" :min="0" />
        </el-form-item>
        <el-form-item label="最大库存">
          <el-input-number v-model="stockForm.maxQuantity" :precision="0" :step="1" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">鍙栨秷</el-button>
        <el-button type="primary" @click="handleSaveStock">淇濆瓨</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockReminderDialogVisible" title="库存提醒" width="760px">
      <el-table :data="stockReminderData" v-loading="stockReminderLoading" border>
        <el-table-column prop="reminderType" label="类型" width="130">
          <template #default="{ row }">
            <el-tag :type="row.reminderType === 'ITEM_STOCK_WARNING' ? 'warning' : 'danger'">
              {{ stockReminderTypeText(row.reminderType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemName" label="物品" min-width="120" />
        <el-table-column prop="quantity" label="物品库存" width="100" />
        <el-table-column prop="warningQuantity" label="预警值" width="90" />
        <el-table-column prop="cabinetName" label="柜子" width="130" />
        <el-table-column prop="slotNo" label="格口" width="80" />
        <el-table-column prop="slotQuantity" label="格口数量" width="100" />
        <el-table-column prop="message" label="提醒内容" min-width="220" />
      </el-table>
      <template #footer>
        <el-button @click="stockReminderDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <input
      ref="itemImportFileInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleItemFileChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLedgerList, exportLedger } from '../../api/ledger.js'
import { getCabinetList } from '../../api/cabinet.js'
import { getItemList, getItemStockReminders, saveItem, saveItemStock, exportItem, exportItemImportTemplate, importItem } from '../../api/item.js'

const activeTab = ref('ledger')
const ledgerLoading = ref(false)
const itemLoading = ref(false)
const ledgerData = ref([])
const itemData = ref([])
const cabinetOptions = ref([])
const itemImportFileInput = ref(null)
const itemDialogVisible = ref(false)
const itemForm = ref({})
const stockDialogVisible = ref(false)
const stockForm = ref({})
const stockReminderDialogVisible = ref(false)
const stockReminderLoading = ref(false)
const stockReminderData = ref([])

const queryForm = ref({
  cabinetId: '',
  operationType: null,
  status: null,
  category: ''
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchLedgerData = async () => {
  ledgerLoading.value = true
  try {
    const params = {
      ...queryForm.value,
      page: pagination.value.page,
      size: pagination.value.pageSize
    }
    const res = await getLedgerList(params)
    ledgerData.value = res.content || []
    pagination.value.total = res.totalElements || 0
  } catch (error) {
    console.error(error)
  } finally {
    ledgerLoading.value = false
  }
}

const fetchItemData = async () => {
  itemLoading.value = true
  try {
    const res = await getItemList()
    itemData.value = res || []
  } finally {
    itemLoading.value = false
  }
}

const fetchCabinetOptions = async () => {
  try {
    const res = await getCabinetList()
    if (res) {
      cabinetOptions.value = (res || []).map(item => ({
        value: item.id,
        label: `${item.name}（柜号${item.cabinetNo}）`
      }))
    }
  } catch (error) {
    console.error(error)
  }
}

const handleQuery = () => {
  pagination.value.page = 1
  fetchLedgerData()
}

const handleReset = () => {
  queryForm.value = {
    cabinetId: '',
    operationType: null,
    status: null,
    category: ''
  }
  pagination.value.page = 1
  fetchLedgerData()
}

const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.page = 1
  fetchLedgerData()
}

const handleCurrentChange = (val) => {
  pagination.value.page = val
  fetchLedgerData()
}

const handleExport = async () => {
  try {
    const res = await exportLedger(queryForm.value)
    downloadBlob(res, '鐗╁搧鍙拌处_' + new Date().toLocaleDateString() + '.xlsx')
    ElMessage.success('瀵煎嚭鎴愬姛')
  } catch (error) {
    ElMessage.error('瀵煎嚭澶辫触')
    console.error(error)
  }
}

const handleItemExport = async () => {
  try {
    const res = await exportItem()
    downloadBlob(res, '鐗╁搧鍩虹淇℃伅_' + new Date().toLocaleDateString() + '.xlsx')
    ElMessage.success('瀵煎嚭鎴愬姛')
  } catch (error) {
    ElMessage.error('瀵煎嚭澶辫触')
    console.error(error)
  }
}

const handleItemImport = () => {
  itemImportFileInput.value?.click()
}

const handleItemTemplateExport = async () => {
  try {
    const res = await exportItemImportTemplate()
    downloadBlob(res, '鐗╁搧鍩虹淇℃伅瀵煎叆妯℃澘.xlsx')
    ElMessage.success('模板已导出')
  } catch (error) {
    ElMessage.error('妯℃澘瀵煎嚭澶辫触')
    console.error(error)
  }
}

const handleItemFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  try {
    const res = await importItem(file)
    if (res) {
      ElMessage.success(res.data || '瀵煎叆鎴愬姛')
      fetchItemData()
      fetchLedgerData()
    }
  } catch (error) {
    ElMessage.error('瀵煎叆澶辫触')
    console.error(error)
  }
  event.target.value = ''
}

const openItemDialog = (row) => {
  itemForm.value = row
    ? { ...row }
    : { name: '', category: '', spec: '', standardWeight: 0, useType: 0, authRequired: 0, warningQuantity: 0, maxQuantity: 0, borrowerReminderHours: 24, adminReminderHours: 48 }
  itemDialogVisible.value = true
}

const handleSaveItem = async () => {
  const res = await saveItem(itemForm.value)
  if (res) {
    ElMessage.success('淇濆瓨鎴愬姛')
    itemDialogVisible.value = false
    fetchItemData()
    fetchLedgerData()
  }
}

const openStockDialog = (row) => {
  stockForm.value = {
    itemId: row.id,
    name: row.name,
    cabinetId: row.cabinetId,
    slotId: row.slotId,
    quantity: row.quantity || 0,
    borrowedQuantity: row.borrowedQuantity || 0,
    ledgerWeight: row.ledgerWeight || 0,
    actualWeight: row.actualWeight || 0,
    warningQuantity: row.warningQuantity || 0,
    maxQuantity: row.maxQuantity || 0
  }
  stockDialogVisible.value = true
}

const handleSaveStock = async () => {
  const res = await saveItemStock(stockForm.value)
  if (res.code === 200) {
    ElMessage.success('库存已保存')
    stockDialogVisible.value = false
    fetchItemData()
  }
}

const openStockReminderDialog = async () => {
  stockReminderDialogVisible.value = true
  stockReminderLoading.value = true
  try {
    const res = await getItemStockReminders()
    stockReminderData.value = res || []
  } finally {
    stockReminderLoading.value = false
  }
}

const stockReminderTypeText = (type) => {
  return ({ ITEM_STOCK_WARNING: '库存预警', SLOT_QUANTITY_LOW: '格口低量' })[type] || '提醒'
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

const stockStatusText = (status) => {
  const map = { 0: '正常', 1: '低库存', 2: '超库存', 3: '重量异常' }
  return map[status] || '鏈煡'
}

const stockStatusTag = (status) => {
  const map = { 0: 'success', 1: 'warning', 2: 'danger', 3: 'danger' }
  return map[status] || 'info'
}

const useTypeText = (type) => {
  return ({ 0: '棰嗙敤', 1: '鍊熺敤', 2: '棰嗙敤/鍊熺敤' })[type] || '棰嗙敤'
}

const operationTypeText = (type) => {
  return ({ 0: '鍏ュ簱', 1: '棰嗙敤', 2: '鍊熺敤', 3: '褰掕繕' })[type] || '鏈煡'
}

const operationTypeTag = (type) => {
  return ({ 0: 'success', 1: 'info', 2: 'warning', 3: 'primary' })[type] || 'info'
}

onMounted(() => {
  fetchCabinetOptions()
  fetchLedgerData()
  fetchItemData()
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.unit {
  margin-left: 8px;
}
</style>
