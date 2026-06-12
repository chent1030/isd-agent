package com.cabinet.service;

import com.cabinet.dto.CabinetItemOperateDTO;
import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReceiveDTO;
import com.cabinet.vo.CabinetOperationVO;

public interface CabinetItemOperationService {
    CabinetOperationVO plan(CabinetItemOperateDTO dto, String operator);

    CabinetOperationVO receive(ItemReceiveDTO dto, String operator);

    CabinetOperationVO borrow(ItemBorrowDTO dto, String operator);
}
