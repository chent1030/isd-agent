package com.cabinet.mapper;

import com.cabinet.entity.CabinetSlot;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface CabinetSlotMapper {
    CabinetSlot selectById(@Param("id") Long id);

    List<CabinetSlot> selectByCabinetId(@Param("cabinetId") String cabinetId);

    CabinetSlot selectByItemId(@Param("itemId") Long itemId);

    List<CabinetSlot> selectByItemIdForAllocation(@Param("itemId") Long itemId);

    CabinetSlot selectByCabinetIdAndSlotNo(@Param("cabinetId") String cabinetId, @Param("slotNo") Integer slotNo);

    int countByCabinetSlotNo(@Param("cabinetId") String cabinetId,
                             @Param("slotNo") Integer slotNo,
                             @Param("excludeId") Long excludeId);

    int countByItemId(@Param("itemId") Long itemId, @Param("excludeId") Long excludeId);

    int decreaseItemQuantity(@Param("slotId") Long slotId, @Param("quantity") Integer quantity);

    int increaseItemQuantity(@Param("slotId") Long slotId, @Param("quantity") Integer quantity);

    int insert(CabinetSlot slot);

    int updateById(CabinetSlot slot);
}
