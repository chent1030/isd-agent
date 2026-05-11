package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cabinet.entity.ItemBorrowRecord;
import com.cabinet.vo.ItemBorrowRecordVO;
import org.apache.ibatis.annotations.Param;

public interface ItemBorrowRecordMapper extends BaseMapper<ItemBorrowRecord> {
    IPage<ItemBorrowRecordVO> selectBorrowRecordPage(Page<ItemBorrowRecordVO> page,
                                                     @Param("status") Integer status,
                                                     @Param("itemId") Long itemId,
                                                     @Param("borrower") String borrower);

    ItemBorrowRecordVO selectBorrowRecordById(@Param("id") Long id);
}
