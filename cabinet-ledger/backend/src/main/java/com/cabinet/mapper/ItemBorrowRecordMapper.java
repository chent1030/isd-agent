package com.cabinet.mapper;

import com.cabinet.entity.ItemBorrowRecord;
import com.cabinet.vo.ItemBorrowRecordVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ItemBorrowRecordMapper {
    ItemBorrowRecord selectById(@Param("id") Long id);

    int insert(ItemBorrowRecord record);

    int updateById(ItemBorrowRecord record);

    List<ItemBorrowRecordVO> selectBorrowRecordList(@Param("status") Integer status,
                                                    @Param("itemId") Long itemId,
                                                    @Param("borrower") String borrower);

    ItemBorrowRecordVO selectBorrowRecordById(@Param("id") Long id);
}
