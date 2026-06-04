<template>
  <div class="cabinet-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>柜子详情</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-descriptions :column="3" border v-if="detail.id">
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="柜号">{{ detail.cabinetNo }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ detail.location }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(detail.status)">{{ statusText(detail.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>格口与物品绑定</span>
          <div class="cabinet-layout-meta">
            <el-tag type="info">{{ columnCount }}排 x {{ rowCount }}行</el-tag>
            <el-button type="primary" size="small" @click="openSlotDialog()">新增格口</el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="cabinet-shell">
        <div
          class="slot-grid"
          :style="{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rowCount}, 112px)`
          }"
        >
          <button
            v-for="slot in physicalSlots"
            :key="slot.slotNo"
            class="slot-card"
            :class="[slotStatusClass(slot), { virtual: slot.virtual }]"
            type="button"
            @click="openSlotDialog(slot)"
          >
            <div class="slot-card-header">
              <span class="slot-no">{{ slot.slotNo }}号格</span>
              <el-tag size="small" :type="slotStatusTag(slot)">
                {{ slotStatusText(slot) }}
              </el-tag>
            </div>
            <div class="slot-item" :title="slot.itemName || '未绑定物品'">
              {{ slot.itemName || '未绑定物品' }}
            </div>
            <div class="slot-meta">
              <span>上限 {{ slot.weightLimit || 0 }}g</span>
              <span v-if="slot.itemQuantity !== null">库存 {{ slot.itemQuantity }}</span>
            </div>
          </button>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="slotDialogVisible" title="格口配置" width="560px">
      <el-form :model="slotForm" label-width="110px">
        <el-form-item label="格口号">
          <el-input-number v-model="slotForm.slotNo" :precision="0" :step="1" :min="1" />
        </el-form-item>
        <el-form-item label="绑定物品">
          <el-select v-model="slotForm.itemId" filterable clearable placeholder="请选择物品" style="width: 320px">
            <el-option
              v-for="item in itemOptions"
              :key="item.id"
              :label="itemLabel(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="称重上限">
          <el-input-number v-model="slotForm.weightLimit" :precision="0" :step="1" :min="0" />
          <span class="unit">g</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="slotForm.status" style="width: 180px">
            <el-option label="空闲" :value="0" />
            <el-option label="占用" :value="1" />
            <el-option label="故障" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="slotForm.id" type="warning" plain @click="clearSlot">清空格口</el-button>
        <el-button @click="slotDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSlot">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCabinetDetail, getCabinetSlots, saveCabinetSlot } from '../../api/cabinet.js'
import { getItemList } from '../../api/item.js'

const route = useRoute()
const detail = ref({})
const slots = ref([])
const itemOptions = ref([])
const loading = ref(false)
const slotDialogVisible = ref(false)
const slotForm = ref({})
const rowCount = 6

const columnCount = computed(() => {
  const text = `${detail.value.name || ''}${detail.value.location || ''}`
  const maxSlotNo = slots.value.reduce((max, slot) => Math.max(max, slot.slotNo || 0), 0)
  if (text.includes('三排') || maxSlotNo > 12) {
    return 3
  }
  return 2
})

const physicalSlots = computed(() => {
  const total = rowCount * columnCount.value
  return Array.from({ length: total }, (_, index) => {
    const slotNo = index + 1
    const slot = slots.value.find(item => item.slotNo === slotNo)
    return slot || {
      cabinetId: route.params.id,
      slotNo,
      itemId: null,
      itemName: '',
      itemQuantity: null,
      weightLimit: 0,
      status: null,
      virtual: true
    }
  })
})

const fetchDetail = async () => {
  const res = await getCabinetDetail(route.params.id)
  detail.value = res || {}
}

const fetchItems = async () => {
  const res = await getItemList()
  itemOptions.value = res || []
}

const fetchSlots = async () => {
  loading.value = true
  try {
    const res = await getCabinetSlots(route.params.id)
    const items = itemOptions.value
    slots.value = (res || []).map(slot => ({
      ...slot,
      itemName: items.find(item => item.id === slot.itemId)?.name || '',
      itemQuantity: items.find(item => item.id === slot.itemId)?.quantity ?? null
    }))
  } finally {
    loading.value = false
  }
}

const openSlotDialog = (row) => {
  slotForm.value = row
    ? { ...row, id: row.virtual ? null : row.id }
    : { cabinetId: route.params.id, slotNo: null, itemId: null, weightLimit: 0, status: 0 }
  slotDialogVisible.value = true
}

const saveSlot = async () => {
  const res = await saveCabinetSlot(slotForm.value)
  if (res) {
    ElMessage.success('保存成功')
    slotDialogVisible.value = false
    fetchSlots()
  }
}

const clearSlot = async () => {
  const res = await saveCabinetSlot({
    ...slotForm.value,
    itemId: null,
    status: 0
  })
  if (res) {
    ElMessage.success('格口已清空')
    slotDialogVisible.value = false
    fetchSlots()
  }
}

const itemLabel = (item) => {
  const spec = item.spec ? ` / ${item.spec}` : ''
  return `${item.name}${spec}`
}

const statusText = (status) => {
  const map = { 0: '停用', 1: '启用', 2: '维护中' }
  return map[status] || '未知'
}

const statusTag = (status) => {
  const map = { 0: 'danger', 1: 'success', 2: 'warning' }
  return map[status] || 'info'
}

const slotStatusText = (slot) => {
  if (slot.virtual) return '未配置'
  const map = { 0: '空闲', 1: '占用', 2: '故障' }
  return map[slot.status] || '未知'
}

const slotStatusTag = (slot) => {
  if (slot.virtual) return 'info'
  const map = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[slot.status] || 'info'
}

const slotStatusClass = (slot) => {
  if (slot.virtual) return 'slot-empty'
  const map = { 0: 'slot-idle', 1: 'slot-occupied', 2: 'slot-fault' }
  return map[slot.status] || 'slot-empty'
}

onMounted(async () => {
  await fetchDetail()
  await fetchItems()
  fetchSlots()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-card {
  margin-top: 16px;
}

.cabinet-layout-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cabinet-shell {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #f5f7fa;
  padding: 18px;
  min-height: 420px;
}

.slot-grid {
  display: grid;
  grid-auto-flow: column;
  gap: 12px;
  max-width: 960px;
  margin: 0 auto;
}

.slot-card {
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  padding: 12px;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.slot-card:not(:disabled):hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.14);
  transform: translateY(-1px);
}

.slot-card:disabled {
  cursor: not-allowed;
}

.slot-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.slot-no {
  font-weight: 600;
  font-size: 15px;
}

.slot-item {
  margin-top: 12px;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #606266;
}

.slot-occupied {
  border-left: 4px solid #67c23a;
}

.slot-idle {
  border-left: 4px solid #909399;
}

.slot-fault {
  border-left: 4px solid #f56c6c;
}

.slot-empty {
  border-style: dashed;
  background: #fafafa;
  color: #909399;
}

.unit {
  margin-left: 8px;
}
</style>
