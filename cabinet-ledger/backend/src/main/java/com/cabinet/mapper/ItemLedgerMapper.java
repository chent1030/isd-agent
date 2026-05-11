package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cabinet.entity.ItemLedger;
import com.cabinet.vo.LedgerVO;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
public interface ItemLedgerMapper extends BaseMapper<ItemLedger> {

    IPage<LedgerVO> selectLedgerPage(Page<LedgerVO> page,
                                     @Param("cabinetId") String cabinetId,
                                     @Param("operationType") Integer operationType,
                                     @Param("status") Integer status,
                                     @Param("category") String category);

    BigDecimal selectTotalWeightBySlotId(@Param("cabinetId") String cabinetId,
                                         @Param("slotId") Long slotId);
}
