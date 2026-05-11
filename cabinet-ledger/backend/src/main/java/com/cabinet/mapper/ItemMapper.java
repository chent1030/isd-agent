package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cabinet.entity.Item;
import com.cabinet.vo.AvailableItemVO;
import com.cabinet.vo.ItemStockVO;

import java.util.List;

public interface ItemMapper extends BaseMapper<Item> {
    List<ItemStockVO> selectItemStockList();

    List<AvailableItemVO> selectAvailableItems();
}
