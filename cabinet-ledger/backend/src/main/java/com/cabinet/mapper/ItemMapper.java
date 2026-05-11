package com.cabinet.mapper;

import com.cabinet.entity.Item;
import com.cabinet.vo.AvailableItemVO;
import com.cabinet.vo.ItemStockVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ItemMapper {
    List<Item> selectAll();

    Item selectById(@Param("id") Long id);

    Item selectByUniqueFields(@Param("name") String name,
                              @Param("category") String category,
                              @Param("spec") String spec);

    int insert(Item item);

    int updateById(Item item);

    List<ItemStockVO> selectItemStockList();

    List<AvailableItemVO> selectAvailableItems();
}
