package com.cabinet.service;

import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReturnDTO;
import com.cabinet.vo.ItemBorrowRecordVO;
import io.choerodon.core.domain.Page;
import java.util.List;

public interface ItemBorrowRecordService {
    ItemBorrowRecordVO borrow(ItemBorrowDTO dto, String operator);

    ItemBorrowRecordVO returnItem(ItemReturnDTO dto, String operator);

    Page<ItemBorrowRecordVO> getBorrowRecordList(Integer status, Long itemId, String borrower, int page, int size);

    List<ItemBorrowRecordVO> getDueReminders(String reminderType);

    boolean markReminder(Long borrowRecordId, String reminderType);
}
