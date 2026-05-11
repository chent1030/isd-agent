package com.cabinet.service;

import com.cabinet.common.PageResult;
import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReturnDTO;
import com.cabinet.vo.ItemBorrowRecordVO;

public interface ItemBorrowRecordService {
    ItemBorrowRecordVO borrow(ItemBorrowDTO dto, String operator);

    ItemBorrowRecordVO returnItem(ItemReturnDTO dto, String operator);

    PageResult<ItemBorrowRecordVO> getBorrowRecordList(Integer status, Long itemId, String borrower, int page, int size);
}
