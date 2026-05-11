package com.cabinet.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.ItemStock;
import com.cabinet.entity.WeightRecord;

public interface ItemStockService extends IService<ItemStock> {
    void syncSlotBinding(CabinetSlot slot);
    void applyLedger(ItemLedger ledger);
    void applyWeightRecord(WeightRecord record);
    void updateStockConfig(Long itemId, Integer warningQuantity, Integer maxQuantity);
    boolean adjustStock(ItemStock stock);
}
