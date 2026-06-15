package com.cabinet.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.cabinet.dto.ItemAuthorizationSaveDTO;
import com.cabinet.entity.ItemAuthorization;
import com.cabinet.mapper.ItemAuthorizationMapper;
import com.cabinet.service.OperationLogService;
import java.time.LocalDateTime;
import javax.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ItemAuthorizationControllerTest {

    @Test
    void saveParsesStringValidPeriodBeforePersisting() {
        ItemAuthorizationMapper authorizationMapper = org.mockito.Mockito.mock(ItemAuthorizationMapper.class);
        OperationLogService operationLogService = org.mockito.Mockito.mock(OperationLogService.class);
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        ItemAuthorizationController controller = new ItemAuthorizationController(authorizationMapper, operationLogService);

        ItemAuthorizationSaveDTO dto = new ItemAuthorizationSaveDTO();
        dto.setItemId(10L);
        dto.setEmployeeNo("U001");
        dto.setEmployeeName("张三");
        dto.setValidFrom("2026-06-13T08:30:00");
        dto.setValidTo("2026-06-20 18:00:00");
        when(authorizationMapper.insert(any(ItemAuthorization.class))).thenReturn(1);

        controller.save(dto, "admin", request);

        ArgumentCaptor<ItemAuthorization> captor = ArgumentCaptor.forClass(ItemAuthorization.class);
        org.mockito.Mockito.verify(authorizationMapper).insert(captor.capture());
        assertThat(captor.getValue().getValidFrom()).isEqualTo(LocalDateTime.of(2026, 6, 13, 8, 30, 0));
        assertThat(captor.getValue().getValidTo()).isEqualTo(LocalDateTime.of(2026, 6, 20, 18, 0, 0));
    }
}
