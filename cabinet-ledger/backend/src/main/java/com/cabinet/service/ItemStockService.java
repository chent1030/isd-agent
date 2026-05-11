package com.cabinet.service;

import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.ItemStock;
import com.cabinet.entity.WeightRecord;

public interface ItemStockService {
    void syncSlotBinding(CabinetSlot slot);
    void clearSlotBinding(Long itemId, Long slotId);
    void applyLedger(ItemLedger ledger);
    void applyWeightRecord(WeightRecord record);
    void updateStockConfig(Long itemId, Integer warningQuantity, Integer maxQuantity);
    ItemStock getStockByItemId(Long itemId);
    boolean adjustStock(ItemStock stock);
}
