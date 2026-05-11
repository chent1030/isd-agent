package com.cabinet.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 称重记录 Excel 导出模板
 */
public class WeightRecordExcelTemplate {

    @ExcelProperty("柜号")
    private String cabinetId;

    @ExcelProperty("格口ID")
    private Long slotId;

    @ExcelProperty("重量(g)")
    private BigDecimal weight;

    @ExcelProperty("变化量(g)")
    private BigDecimal changeAmount;

    @ExcelProperty("事件类型")
    private String eventTypeText;

    @ExcelProperty("记录时间")
    private LocalDateTime recordedAt;

    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }

    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public BigDecimal getChangeAmount() { return changeAmount; }
    public void setChangeAmount(BigDecimal changeAmount) { this.changeAmount = changeAmount; }

    public String getEventTypeText() { return eventTypeText; }
    public void setEventTypeText(String eventTypeText) { this.eventTypeText = eventTypeText; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
