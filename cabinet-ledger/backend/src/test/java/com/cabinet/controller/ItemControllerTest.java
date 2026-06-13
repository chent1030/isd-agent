package com.cabinet.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.cabinet.common.Result;
import com.cabinet.dto.ItemSaveDTO;
import com.cabinet.entity.Item;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.service.CabinetItemOperationService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.OperationLogService;
import com.cabinet.vo.ItemStockReminderVO;
import java.util.Collections;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ItemControllerTest {

    @Test
    void stockRemindersReturnsLowStockReminderRows() {
        ItemMapper itemMapper = org.mockito.Mockito.mock(ItemMapper.class);
        ItemStockService itemStockService = org.mockito.Mockito.mock(ItemStockService.class);
        CabinetItemOperationService cabinetItemOperationService = org.mockito.Mockito.mock(CabinetItemOperationService.class);
        OperationLogService operationLogService = org.mockito.Mockito.mock(OperationLogService.class);
        ExcelUtil excelUtil = org.mockito.Mockito.mock(ExcelUtil.class);
        ItemController controller = new ItemController(itemMapper, itemStockService, cabinetItemOperationService,
                operationLogService, excelUtil);

        ItemStockReminderVO reminder = new ItemStockReminderVO();
        reminder.setItemId(1L);
        reminder.setItemName("手套");
        reminder.setReminderType("ITEM_STOCK_WARNING");
        when(itemMapper.selectStockReminders()).thenReturn(Collections.singletonList(reminder));

        Result<List<ItemStockReminderVO>> result = controller.stockReminders();

        assertThat(result.getCode()).isEqualTo(200);
        assertThat(result.getData()).hasSize(1);
        assertThat(result.getData().get(0).getReminderType()).isEqualTo("ITEM_STOCK_WARNING");
    }

    @Test
    void saveReceiveOnlyItemClearsBorrowReminderHours() {
        ItemMapper itemMapper = org.mockito.Mockito.mock(ItemMapper.class);
        ItemStockService itemStockService = org.mockito.Mockito.mock(ItemStockService.class);
        CabinetItemOperationService cabinetItemOperationService = org.mockito.Mockito.mock(CabinetItemOperationService.class);
        OperationLogService operationLogService = org.mockito.Mockito.mock(OperationLogService.class);
        ExcelUtil excelUtil = org.mockito.Mockito.mock(ExcelUtil.class);
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        ItemController controller = new ItemController(itemMapper, itemStockService, cabinetItemOperationService,
                operationLogService, excelUtil);

        ItemSaveDTO dto = new ItemSaveDTO();
        dto.setName("手套");
        dto.setUseType(0);
        dto.setBorrowerReminderHours(24);
        dto.setAdminReminderHours(48);
        when(itemMapper.insert(any(Item.class))).thenReturn(1);

        controller.save(dto, "admin", request);

        ArgumentCaptor<Item> itemCaptor = ArgumentCaptor.forClass(Item.class);
        org.mockito.Mockito.verify(itemMapper).insert(itemCaptor.capture());
        assertThat(itemCaptor.getValue().getBorrowerReminderHours()).isNull();
        assertThat(itemCaptor.getValue().getAdminReminderHours()).isNull();
    }
}
