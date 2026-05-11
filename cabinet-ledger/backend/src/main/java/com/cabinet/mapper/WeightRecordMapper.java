package com.cabinet.mapper;

import com.cabinet.entity.WeightRecord;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface WeightRecordMapper {
    int insert(WeightRecord record);

    List<WeightRecord> selectByCabinetId(@Param("cabinetId") String cabinetId);

    List<WeightRecord> selectLatestByCabinetId(@Param("cabinetId") String cabinetId);

    WeightRecord selectLatestBySlotId(@Param("cabinetId") String cabinetId,
                                      @Param("slotId") Long slotId);
}
