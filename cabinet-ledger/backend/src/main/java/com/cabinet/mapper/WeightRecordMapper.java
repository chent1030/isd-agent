package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cabinet.entity.WeightRecord;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface WeightRecordMapper extends BaseMapper<WeightRecord> {
    List<WeightRecord> selectLatestByCabinetId(@Param("cabinetId") String cabinetId);

    WeightRecord selectLatestBySlotId(@Param("cabinetId") String cabinetId,
                                      @Param("slotId") Long slotId);
}
