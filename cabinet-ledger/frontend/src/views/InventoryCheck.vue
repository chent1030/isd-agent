<template>
  <div class="inventory-check">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存盘点</span>
        </div>
      </template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="选择柜号">
          <el-select v-model="form.cabinetId" placeholder="请选择柜号" style="width: 300px" @change="handleCabinetChange">
            <el-option
              v-for="item in cabinetOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择格口">
          <el-select
            v-model="form.slotId"
            placeholder="请选择格口"
            style="width: 300px"
            :disabled="!form.cabinetId"
          >
            <el-option
              v-for="item in slotOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实际称重重量">
          <el-input-number v-model="form.actualWeight" :precision="0" :step="1" style="width: 300px" />
          <span style="margin-left: 10px">g；留空或 0 时使用该格口最新称重</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCheck">开始盘点</el-button>
        </el-form-item>
      </el-form>

      <el-divider v-if="result" />

      <div v-if="result" class="result-section">
        <h3>盘点结果</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="柜号">{{ result.cabinetId }}</el-descriptions-item>
          <el-descriptions-item label="格口">{{ result.slotNo }}</el-descriptions-item>
          <el-descriptions-item label="台账总重量">{{ result.ledgerWeight }} g</el-descriptions-item>
          <el-descriptions-item label="实际称重">{{ result.actualWeight }} g</el-descriptions-item>
          <el-descriptions-item label="差异重量">{{ result.diffWeight }} g</el-descriptions-item>
          <el-descriptions-item label="差异率">{{ result.diffRate }}%</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="result.status === 'normal' ? 'success' : result.status === 'warning' ? 'warning' : 'danger'">
              {{ statusText(result.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { checkInventory } from '../api/ledger.js'
import { getCabinetList, getCabinetSlots } from '../api/cabinet.js'

const form = ref({
  cabinetId: '',
  slotId: null,
  actualWeight: 0
})

const result = ref(null)
const cabinetOptions = ref([])
const slotOptions = ref([])

const fetchCabinetOptions = async () => {
  try {
    const res = await getCabinetList()
    if (res) {
      cabinetOptions.value = (res || []).map(item => ({
        value: item.id,
        label: `${item.name} (${item.id})`
      }))
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchSlotOptions = async (cabinetId) => {
  if (!cabinetId) {
    slotOptions.value = []
    return
  }
  try {
    const res = await getCabinetSlots(cabinetId)
    slotOptions.value = (res || []).map(item => ({
      value: item.id,
      label: `格口 ${item.slotNo}`
    }))
  } catch (error) {
    console.error(error)
  }
}

const handleCabinetChange = (cabinetId) => {
  form.value.slotId = null
  result.value = null
  fetchSlotOptions(cabinetId)
}

const handleCheck = async () => {
  if (!form.value.cabinetId) {
    ElMessage.warning('请选择柜号')
    return
  }
  if (!form.value.slotId) {
    ElMessage.warning('请选择格口')
    return
  }
  try {
    const res = await checkInventory({
      cabinetId: form.value.cabinetId,
      slotId: form.value.slotId,
      actualWeight: form.value.actualWeight || null
    })
    if (res) {
      result.value = res.data
      ElMessage.success('盘点完成')
    }
  } catch (error) {
    console.error(error)
  }
}

const statusText = (status) => {
  const map = { normal: '正常', warning: '警告', abnormal: '异常' }
  return map[status] || status
}

onMounted(() => {
  fetchCabinetOptions()
})
</script>

<style scoped>
.result-section {
  margin-top: 20px;
}
.result-section h3 {
  margin-bottom: 15px;
}
</style>
