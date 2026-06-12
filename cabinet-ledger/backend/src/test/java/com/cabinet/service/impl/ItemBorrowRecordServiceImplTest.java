package com.cabinet.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cabinet.dto.ItemReturnDTO;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemBorrowRecord;
import com.cabinet.entity.ItemLedger;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.mapper.ItemBorrowRecordMapper;
import com.cabinet.mapper.ItemLedgerMapper;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.mapper.ItemStockMapper;
import com.cabinet.vo.ItemBorrowRecordVO;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ItemBorrowRecordServiceImplTest {

    private final ItemBorrowRecordMapper borrowRecordMapper = org.mockito.Mockito.mock(ItemBorrowRecordMapper.class);
    private final ItemMapper itemMapper = org.mockito.Mockito.mock(ItemMapper.class);
    private final CabinetSlotMapper cabinetSlotMapper = org.mockito.Mockito.mock(CabinetSlotMapper.class);
    private final ItemStockMapper itemStockMapper = org.mockito.Mockito.mock(ItemStockMapper.class);
    private final ItemLedgerMapper itemLedgerMapper = org.mockito.Mockito.mock(ItemLedgerMapper.class);

    @Test
    void returnItemRestoresStockAndWritesReturnLedger() {
        ItemBorrowRecordServiceImpl service = new ItemBorrowRecordServiceImpl(
                borrowRecordMapper,
                itemMapper,
                cabinetSlotMapper,
                itemStockMapper,
                itemLedgerMapper
        );

        ItemBorrowRecord record = new ItemBorrowRecord();
        record.setId(10L);
        record.setItemId(20L);
        record.setCabinetId("CAB-1");
        record.setSlotId(30L);
        record.setQuantity(5);
        record.setReturnedQuantity(1);

        Item item = new Item();
        item.setId(20L);

        CabinetSlot slot = new CabinetSlot();
        slot.setId(30L);
        slot.setCabinetId("CAB-1");

        ItemReturnDTO dto = new ItemReturnDTO();
        dto.setBorrowRecordId(10L);
        dto.setQuantity(2);
        dto.setOperatorNo("U001");
        dto.setOperatorName("张三");

        when(borrowRecordMapper.selectById(10L)).thenReturn(record);
        when(itemMapper.selectById(20L)).thenReturn(item);
        when(cabinetSlotMapper.selectById(30L)).thenReturn(slot);
        when(itemMapper.increaseStockAndDecreaseBorrowed(20L, 2)).thenReturn(1);
        when(cabinetSlotMapper.increaseItemQuantity(30L, 2)).thenReturn(1);
        when(itemLedgerMapper.insert(any(ItemLedger.class))).thenReturn(1);
        when(borrowRecordMapper.selectBorrowRecordById(10L)).thenReturn(new ItemBorrowRecordVO());

        service.returnItem(dto, "admin");

        verify(itemMapper).increaseStockAndDecreaseBorrowed(20L, 2);
        verify(cabinetSlotMapper).increaseItemQuantity(30L, 2);
        ArgumentCaptor<ItemLedger> ledgerCaptor = ArgumentCaptor.forClass(ItemLedger.class);
        verify(itemLedgerMapper).insert(ledgerCaptor.capture());
        ItemLedger ledger = ledgerCaptor.getValue();
        assertThat(ledger.getItemId()).isEqualTo(20L);
        assertThat(ledger.getCabinetId()).isEqualTo("CAB-1");
        assertThat(ledger.getSlotId()).isEqualTo(30L);
        assertThat(ledger.getQuantity()).isEqualTo(2);
        assertThat(ledger.getOperationType()).isEqualTo(3);
        assertThat(ledger.getStatus()).isEqualTo(0);
        assertThat(ledger.getOperatorNo()).isEqualTo("U001");
        assertThat(ledger.getOperatorName()).isEqualTo("张三");
    }
}
