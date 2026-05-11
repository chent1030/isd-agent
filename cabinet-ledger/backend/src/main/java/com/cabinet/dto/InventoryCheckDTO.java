package com.cabinet.dto;

import java.math.BigDecimal;

public class InventoryCheckDTO {
    private String cabinetId;
    private Long slotId;
    private BigDecimal actualWeight;

    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public BigDecimal getActualWeight() { return actualWeight; }
    public void setActualWeight(BigDecimal actualWeight) { this.actualWeight = actualWeight; }
}
