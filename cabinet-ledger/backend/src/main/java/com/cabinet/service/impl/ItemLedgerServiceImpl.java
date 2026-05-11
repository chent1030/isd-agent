package com.cabinet.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cabinet.common.PageResult;
import com.cabinet.dto.InventoryCheckDTO;
import com.cabinet.entity.Cabinet;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.WeightRecord;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.mapper.ItemLedgerMapper;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.mapper.WeightRecordMapper;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.CabinetService;
import com.cabinet.util.WeightUnitUtil;
import com.cabinet.vo.InventoryCheckVO;
import com.cabinet.vo.LedgerVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class ItemLedgerServiceImpl implements ItemLedgerService {

    private final ItemLedgerMapper itemLedgerMapper;
    private final WeightRecordMapper weightRecordMapper;
    private final CabinetSlotMapper cabinetSlotMapper;
    private final ItemMapper itemMapper;
    private final ItemStockService itemStockService;
    private final CabinetService cabinetService;

    public ItemLedgerServiceImpl(ItemLedgerMapper itemLedgerMapper,
                                 WeightRecordMapper weightRecordMapper,
                                 CabinetSlotMapper cabinetSlotMapper,
                                 ItemMapper itemMapper,
                                 ItemStockService itemStockService,
                                 CabinetService cabinetService) {
        this.itemLedgerMapper = itemLedgerMapper;
        this.weightRecordMapper = weightRecordMapper;
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.itemMapper = itemMapper;
        this.itemStockService = itemStockService;
        this.cabinetService = cabinetService;
    }

    @Override
    public PageResult<LedgerVO> getLedgerList(String cabinetId, Integer operationType, Integer status, String category, int page, int size) {
        int current = page <= 0 ? 1 : page;
        int pageSize = size <= 0 ? 20 : size;
        IPage<LedgerVO> pageResult = itemLedgerMapper.selectLedgerPage(new Page<>(current, pageSize), cabinetId, operationType, status, category);
        
        PageResult<LedgerVO> result = new PageResult<>();
        result.setTotal(pageResult.getTotal());
        result.setPage((int) pageResult.getCurrent());
        result.setPageSize((int) pageResult.getSize());
        result.setList(pageResult.getRecords());
        return result;
    }

    @Override
    public InventoryCheckVO checkInventory(InventoryCheckDTO dto) {
        if (dto.getCabinetId() == null || dto.getCabinetId().isEmpty()) {
            throw new IllegalArgumentException("柜号不能为空");
        }
        if (dto.getSlotId() == null) {
            throw new IllegalArgumentException("格口不能为空");
        }

        CabinetSlot slot = cabinetSlotMapper.selectById(dto.getSlotId());
        if (slot == null || !dto.getCabinetId().equals(slot.getCabinetId())) {
            throw new IllegalArgumentException("格口不存在或不属于当前柜子");
        }

        BigDecimal ledgerWeight = itemLedgerMapper.selectTotalWeightBySlotId(dto.getCabinetId(), dto.getSlotId());
        if (ledgerWeight == null) {
            ledgerWeight = BigDecimal.ZERO;
        }

        BigDecimal actualWeight = dto.getActualWeight();
        if (actualWeight == null) {
            WeightRecord latestRecord = weightRecordMapper.selectLatestBySlotId(dto.getCabinetId(), dto.getSlotId());
            actualWeight = latestRecord == null || latestRecord.getWeight() == null
                    ? BigDecimal.ZERO
                    : latestRecord.getWeight();
        } else {
            actualWeight = WeightUnitUtil.requireIntegerGram(actualWeight, "实际称重重量");
        }

        BigDecimal diffWeight = actualWeight.subtract(ledgerWeight);

        BigDecimal diffRate = BigDecimal.ZERO;
        if (ledgerWeight.compareTo(BigDecimal.ZERO) > 0) {
            diffRate = diffWeight.abs()
                    .divide(ledgerWeight, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        String status;
        if (diffRate.compareTo(new BigDecimal("5")) > 0) {
            status = "abnormal";
        } else if (diffRate.compareTo(new BigDecimal("1")) > 0) {
            status = "warning";
        } else {
            status = "normal";
        }

        InventoryCheckVO vo = new InventoryCheckVO();
        vo.setCabinetId(dto.getCabinetId());
        Cabinet cabinet = cabinetService.getById(dto.getCabinetId());
        if (cabinet != null) {
            vo.setCabinetNo(cabinet.getCabinetNo());
        }
        vo.setSlotId(dto.getSlotId());
        vo.setSlotNo(slot.getSlotNo());
        vo.setLedgerWeight(ledgerWeight);
        vo.setActualWeight(actualWeight);
        vo.setDiffWeight(diffWeight);
        vo.setDiffRate(diffRate);
        vo.setStatus(status);
        return vo;
    }

    @Override
    public boolean saveLedger(ItemLedger ledger) {
        normalizeLedgerForSave(ledger);
        boolean success = itemLedgerMapper.insert(ledger) > 0;
        if (success) {
            itemStockService.applyLedger(ledger);
        }
        return success;
    }

    @Override
    public boolean updateLedger(ItemLedger ledger) {
        return itemLedgerMapper.updateById(ledger) > 0;
    }

    @Override
    public void createAutoLedgerFromWeightRecord(WeightRecord record) {
        CabinetSlot slot = cabinetSlotMapper.selectById(record.getSlotId());
        ItemLedger ledger = new ItemLedger();
        ledger.setItemId(slot == null ? null : slot.getItemId());
        ledger.setCabinetId(record.getCabinetId());
        ledger.setSlotId(record.getSlotId());
        ledger.setQuantity(1);
        ledger.setTotalWeight(record.getChangeAmount().abs());
        ledger.setWeightRecordId(record.getId());
        ledger.setRemark("称重变化自动登记，事件类型：" + record.getEventType());
        if (record.getEventType() != null && record.getEventType() == 2) {
            ledger.setStatus(1);
            ledger.setRemovedBy("system");
            ledger.setRemovedAt(record.getRecordedAt());
        } else {
            ledger.setStatus(0);
            ledger.setStoredBy("system");
            ledger.setStoredAt(record.getRecordedAt());
        }
        normalizeLedgerForSave(ledger);
        itemLedgerMapper.insert(ledger);
        itemStockService.applyLedger(ledger);
    }

    private void normalizeLedgerForSave(ItemLedger ledger) {
        LocalDateTime now = LocalDateTime.now();
        if (ledger.getQuantity() == null) {
            ledger.setQuantity(1);
        }
        if (ledger.getTotalWeight() == null) {
            ledger.setTotalWeight(BigDecimal.ZERO);
        } else {
            ledger.setTotalWeight(WeightUnitUtil.requireIntegerGram(ledger.getTotalWeight(), "总重量"));
        }
        if (ledger.getStatus() == null) {
            ledger.setStatus(0);
        }
        if (ledger.getOperationType() == null) {
            ledger.setOperationType(ledger.getStatus() != null && ledger.getStatus() == 1 ? 1 : 0);
        }
        validateItemUseType(ledger);
        if (ledger.getStatus() == 0 && ledger.getStoredAt() == null) {
            ledger.setStoredAt(now);
        }
        if (ledger.getStatus() == 1 && ledger.getRemovedAt() == null) {
            ledger.setRemovedAt(now);
        }
        if (ledger.getCreatedAt() == null) {
            ledger.setCreatedAt(now);
        }
        if (ledger.getUpdatedAt() == null) {
            ledger.setUpdatedAt(now);
        }
    }

    private void validateItemUseType(ItemLedger ledger) {
        if (ledger.getItemId() == null || ledger.getOperationType() == null) {
            return;
        }
        Item item = itemMapper.selectById(ledger.getItemId());
        if (item == null || item.getUseType() == null) {
            return;
        }
        if (ledger.getOperationType() == 1 && item.getUseType() == 1) {
            throw new IllegalArgumentException("该物品仅支持借用，不能领用");
        }
        if (ledger.getOperationType() == 2 && item.getUseType() == 0) {
            throw new IllegalArgumentException("该物品仅支持领用，不能借用");
        }
    }
}
