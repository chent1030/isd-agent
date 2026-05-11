package com.cabinet.vo;

import java.math.BigDecimal;

public class WeightReportVO {
    private Long recordId;
    private boolean changeDetected;
    private BigDecimal changeAmount;
    private Integer eventType;

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public boolean isChangeDetected() { return changeDetected; }
    public void setChangeDetected(boolean changeDetected) { this.changeDetected = changeDetected; }
    public BigDecimal getChangeAmount() { return changeAmount; }
    public void setChangeAmount(BigDecimal changeAmount) { this.changeAmount = changeAmount; }
    public Integer getEventType() { return eventType; }
    public void setEventType(Integer eventType) { this.eventType = eventType; }
}
