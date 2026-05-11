package com.cabinet.service;

import com.cabinet.dto.WeightReportDTO;
import com.cabinet.entity.WeightRecord;
import com.cabinet.vo.WeightReportVO;

import java.util.List;

/**
 * 称重记录 Service 接口
 */
public interface WeightRecordService {
    WeightReportVO reportWeight(WeightReportDTO dto);

    java.math.BigDecimal getLatestCabinetWeight(String cabinetId);

    List<WeightRecord> listByCabinetId(String cabinetId);
}
