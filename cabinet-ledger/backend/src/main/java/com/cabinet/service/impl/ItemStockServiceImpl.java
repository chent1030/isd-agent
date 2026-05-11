package com.cabinet.service.impl;

import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.ItemStock;
import com.cabinet.entity.WeightRecord;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.mapper.ItemStockMapper;
import com.cabinet.properties.CabinetLedgerProperties;
import com.cabinet.service.ItemStockService;
import com.cabinet.util.WeightUnitUtil;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

@Service
public class ItemStockServiceImpl implements ItemStockService {
    private final ItemStockMapper itemStockMapper;
    private final CabinetSlotMapper cabinetSlotMapper;
    private final CabinetLedgerProperties properties;

    public ItemStockServiceImpl(ItemStockMapper itemStockMapper,
                                CabinetSlotMapper cabinetSlotMapper,
                                CabinetLedgerProperties properties) {
        this.itemStockMapper = itemStockMapper;
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.properties = properties;
    }

    @Override
    public void syncSlotBinding(CabinetSlot slot) {
        if (slot == null || slot.getItemId() == null || slot.getId() == null) {
            return;
        }
        ItemStock stock = getOrCreateByItemId(slot.getItemId());
        stock.setCabinetId(slot.getCabinetId());
        stock.setSlotId(slot.getId());
        saveOrUpdateStock(stock);
    }

    @Override
    public void clearSlotBinding(Long itemId, Long slotId) {
        if (itemId == null) {
            return;
        }
        ItemStock stock = getOrCreateByItemId(itemId);
        if (slotId == null || slotId.equals(stock.getSlotId())) {
            stock.setCabinetId(null);
            stock.setSlotId(null);
            saveOrUpdateStock(stock);
        }
    }

    @Override
    public void applyLedger(ItemLedger ledger) {
        if (ledger == null || ledger.getItemId() == null) {
            return;
        }
        ItemStock stock = getOrCreateByItemId(ledger.getItemId());
        stock.setCabinetId(ledger.getCabinetId());
        stock.setSlotId(ledger.getSlotId());

        int quantity = ledger.getQuantity() == null ? 0 : ledger.getQuantity();
        BigDecimal weight = ledger.getTotalWeight() == null ? BigDecimal.ZERO : ledger.getTotalWeight();
        Integer operationType = ledger.getOperationType();
        if (operationType != null && operationType == 2) {
            stock.setQuantity(nonNull(stock.getQuantity()) - quantity);
            stock.setLedgerWeight(nonNull(stock.getLedgerWeight()).subtract(weight));
            stock.setBorrowedQuantity(nonNull(stock.getBorrowedQuantity()) + quantity);
        } else if (operationType != null && operationType == 3) {
            stock.setQuantity(nonNull(stock.getQuantity()) + quantity);
            stock.setLedgerWeight(nonNull(stock.getLedgerWeight()).add(weight));
            stock.setBorrowedQuantity(nonNull(stock.getBorrowedQuantity()) - quantity);
        } else if (ledger.getStatus() != null && ledger.getStatus() == 1) {
            stock.setQuantity(nonNull(stock.getQuantity()) - quantity);
            stock.setLedgerWeight(nonNull(stock.getLedgerWeight()).subtract(weight));
        } else if (ledger.getStatus() == null || ledger.getStatus() == 0) {
            stock.setQuantity(nonNull(stock.getQuantity()) + quantity);
            stock.setLedgerWeight(nonNull(stock.getLedgerWeight()).add(weight));
        }
        saveOrUpdateStock(stock);
    }

    @Override
    public void applyWeightRecord(WeightRecord record) {
        if (record == null || record.getSlotId() == null) {
            return;
        }
        CabinetSlot slot = cabinetSlotMapper.selectById(record.getSlotId());
        if (slot == null || slot.getItemId() == null) {
            return;
        }
        ItemStock stock = getOrCreateByItemId(slot.getItemId());
        stock.setCabinetId(record.getCabinetId());
        stock.setSlotId(record.getSlotId());
        stock.setActualWeight(record.getWeight() == null ? BigDecimal.ZERO : record.getWeight());
        saveOrUpdateStock(stock);
    }

    @Override
    public void updateStockConfig(Long itemId, Integer warningQuantity, Integer maxQuantity) {
        if (itemId == null) {
            return;
        }
        ItemStock stock = getOrCreateByItemId(itemId);
        stock.setWarningQuantity(warningQuantity == null ? 0 : warningQuantity);
        stock.setMaxQuantity(maxQuantity == null ? 0 : maxQuantity);
        saveOrUpdateStock(stock);
    }

    @Override
    public ItemStock getStockByItemId(Long itemId) {
        if (itemId == null) {
            return null;
        }
        return getOrCreateByItemId(itemId);
    }

    @Override
    public boolean adjustStock(ItemStock input) {
        if (input == null || input.getItemId() == null) {
            throw new IllegalArgumentException("物品ID不能为空");
        }
        if (input.getQuantity() != null && input.getQuantity() < 0) {
            throw new IllegalArgumentException("当前库存不能为负数");
        }
        if (input.getBorrowedQuantity() != null && input.getBorrowedQuantity() < 0) {
            throw new IllegalArgumentException("外借数量不能为负数");
        }
        if (input.getWarningQuantity() != null && input.getWarningQuantity() < 0) {
            throw new IllegalArgumentException("预警数量不能为负数");
        }
        if (input.getMaxQuantity() != null && input.getMaxQuantity() < 0) {
            throw new IllegalArgumentException("最大库存不能为负数");
        }

        ItemStock stock = getOrCreateByItemId(input.getItemId());
        if (input.getCabinetId() != null) stock.setCabinetId(input.getCabinetId());
        if (input.getSlotId() != null) stock.setSlotId(input.getSlotId());
        stock.setQuantity(input.getQuantity() == null ? 0 : input.getQuantity());
        stock.setBorrowedQuantity(input.getBorrowedQuantity() == null ? nonNull(stock.getBorrowedQuantity()) : input.getBorrowedQuantity());
        stock.setLedgerWeight(WeightUnitUtil.zeroIfNullIntegerGram(input.getLedgerWeight(), "台账重量"));
        stock.setActualWeight(WeightUnitUtil.zeroIfNullIntegerGram(input.getActualWeight(), "实际重量"));
        stock.setWarningQuantity(input.getWarningQuantity() == null ? 0 : input.getWarningQuantity());
        stock.setMaxQuantity(input.getMaxQuantity() == null ? 0 : input.getMaxQuantity());
        saveOrUpdateStock(stock);
        return true;
    }

    private ItemStock getOrCreateByItemId(Long itemId) {
        ItemStock stock = itemStockMapper.selectByItemId(itemId);
        if (stock != null) {
            return stock;
        }
        stock = new ItemStock();
        stock.setItemId(itemId);
        stock.setQuantity(0);
        stock.setBorrowedQuantity(0);
        stock.setLedgerWeight(BigDecimal.ZERO);
        stock.setActualWeight(BigDecimal.ZERO);
        stock.setWarningQuantity(0);
        stock.setMaxQuantity(0);
        stock.setStockStatus(0);
        return stock;
    }

    private void saveOrUpdateStock(ItemStock stock) {
        normalize(stock);
        stock.setUpdatedAt(LocalDateTime.now());
        if (stock.getId() == null) {
            itemStockMapper.insert(stock);
        } else {
            itemStockMapper.updateById(stock);
        }
    }

    private void normalize(ItemStock stock) {
        if (stock.getQuantity() == null) stock.setQuantity(0);
        if (stock.getBorrowedQuantity() == null) stock.setBorrowedQuantity(0);
        if (stock.getLedgerWeight() == null) stock.setLedgerWeight(BigDecimal.ZERO);
        if (stock.getActualWeight() == null) stock.setActualWeight(BigDecimal.ZERO);
        if (stock.getWarningQuantity() == null) stock.setWarningQuantity(0);
        if (stock.getMaxQuantity() == null) stock.setMaxQuantity(0);
        if (stock.getQuantity() < 0) stock.setQuantity(0);
        if (stock.getBorrowedQuantity() < 0) stock.setBorrowedQuantity(0);
        if (stock.getLedgerWeight().signum() < 0) stock.setLedgerWeight(BigDecimal.ZERO);
        stock.setStockStatus(resolveStatus(stock));
    }

    private int resolveStatus(ItemStock stock) {
        BigDecimal diff = stock.getActualWeight().subtract(stock.getLedgerWeight()).abs();
        if (diff.compareTo(properties.getWeightChangeThreshold()) > 0) {
            return 3;
        }
        if (stock.getMaxQuantity() > 0 && stock.getQuantity() > stock.getMaxQuantity()) {
            return 2;
        }
        if (stock.getWarningQuantity() > 0 && stock.getQuantity() <= stock.getWarningQuantity()) {
            return 1;
        }
        return 0;
    }

    private int nonNull(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
