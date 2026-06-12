package com.cabinet.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.cabinet.common.Result;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.service.CabinetItemOperationService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.OperationLogService;
import com.cabinet.vo.ItemStockReminderVO;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

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
}
