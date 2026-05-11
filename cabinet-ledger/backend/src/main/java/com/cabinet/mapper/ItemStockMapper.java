package com.cabinet.mapper;

import com.cabinet.entity.ItemStock;
import org.apache.ibatis.annotations.Param;

public interface ItemStockMapper {
    ItemStock selectByItemId(@Param("itemId") Long itemId);

    int insert(ItemStock stock);

    int updateById(ItemStock stock);
}
