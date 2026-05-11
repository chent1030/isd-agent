package com.cabinet.mapper;

import com.cabinet.entity.ItemLedger;
import com.cabinet.vo.LedgerVO;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ItemLedgerMapper {
    int insert(ItemLedger ledger);

    int updateById(ItemLedger ledger);

    List<LedgerVO> selectLedgerList(@Param("cabinetId") String cabinetId,
                                    @Param("operationType") Integer operationType,
                                    @Param("status") Integer status,
                                    @Param("category") String category);

    BigDecimal selectTotalWeightBySlotId(@Param("cabinetId") String cabinetId,
                                         @Param("slotId") Long slotId);
}
