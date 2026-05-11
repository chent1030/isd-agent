package com.cabinet.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.cabinet.dto.WeightReportDTO;
import com.cabinet.entity.WeightRecord;
import com.cabinet.vo.WeightReportVO;

/**
 * 称重记录 Service 接口
 */
public interface WeightRecordService extends IService<WeightRecord> {
    WeightReportVO reportWeight(WeightReportDTO dto);

    java.math.BigDecimal getLatestCabinetWeight(String cabinetId);
}
