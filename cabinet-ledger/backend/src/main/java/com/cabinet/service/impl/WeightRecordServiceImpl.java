package com.cabinet.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cabinet.dto.WeightReportDTO;
import com.cabinet.entity.WeightRecord;
import com.cabinet.mapper.WeightRecordMapper;
import com.cabinet.properties.CabinetLedgerProperties;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.WeightRecordService;
import com.cabinet.util.WeightUnitUtil;
import com.cabinet.vo.WeightReportVO;
import org.springframework.stereotype.Service;

@Service
public class WeightRecordServiceImpl extends ServiceImpl<WeightRecordMapper, WeightRecord> implements WeightRecordService {
    private final CabinetLedgerProperties properties;
    private final ItemLedgerService itemLedgerService;
    private final ItemStockService itemStockService;

    public WeightRecordServiceImpl(CabinetLedgerProperties properties,
                                   ItemLedgerService itemLedgerService,
                                   ItemStockService itemStockService) {
        this.properties = properties;
        this.itemLedgerService = itemLedgerService;
        this.itemStockService = itemStockService;
    }

    @Override
    public WeightReportVO reportWeight(WeightReportDTO dto) {
        if (dto.getCabinetId() == null || dto.getCabinetId().isEmpty()) {
            throw new IllegalArgumentException("柜号不能为空");
        }
        if (dto.getSlotId() == null) {
            throw new IllegalArgumentException("格口ID不能为空");
        }
        if (dto.getWeight() == null) {
            throw new IllegalArgumentException("重量不能为空");
        }
        dto.setWeight(WeightUnitUtil.requireIntegerGram(dto.getWeight(), "重量"));

        WeightRecord previous = lambdaQuery()
                .eq(WeightRecord::getCabinetId, dto.getCabinetId())
                .eq(WeightRecord::getSlotId, dto.getSlotId())
                .orderByDesc(WeightRecord::getRecordedAt)
                .last("LIMIT 1")
                .one();

        BigDecimal changeAmount = previous == null
                ? BigDecimal.ZERO
                : dto.getWeight().subtract(previous.getWeight());
        BigDecimal absChange = changeAmount.abs();
        int eventType = 0;
        if (absChange.compareTo(properties.getWeightChangeThreshold()) >= 0) {
            eventType = changeAmount.signum() > 0 ? 1 : 2;
        }

        WeightRecord record = new WeightRecord();
        record.setCabinetId(dto.getCabinetId());
        record.setSlotId(dto.getSlotId());
        record.setWeight(dto.getWeight());
        record.setChangeAmount(changeAmount);
        record.setEventType(eventType);
        record.setRecordedAt(dto.getTimestamp() == null ? LocalDateTime.now() : dto.getTimestamp());
        save(record);
        itemStockService.applyWeightRecord(record);

        if (eventType != 0) {
            itemLedgerService.createAutoLedgerFromWeightRecord(record);
        }

        WeightReportVO vo = new WeightReportVO();
        vo.setRecordId(record.getId());
        vo.setChangeDetected(eventType != 0);
        vo.setChangeAmount(changeAmount);
        vo.setEventType(eventType);
        return vo;
    }

    @Override
    public BigDecimal getLatestCabinetWeight(String cabinetId) {
        List<WeightRecord> latestBySlot = baseMapper.selectLatestByCabinetId(cabinetId);
        return latestBySlot.stream()
                .map(WeightRecord::getWeight)
                .filter(weight -> weight != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
