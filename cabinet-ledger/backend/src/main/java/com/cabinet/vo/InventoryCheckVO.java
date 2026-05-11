package com.cabinet.vo;

import java.math.BigDecimal;

public class InventoryCheckVO {
    private String cabinetId;
    private Integer cabinetNo;
    private Long slotId;
    private Integer slotNo;
    private BigDecimal ledgerWeight;
    private BigDecimal actualWeight;
    private BigDecimal diffWeight;
    private BigDecimal diffRate;
    private String status;

    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public BigDecimal getLedgerWeight() { return ledgerWeight; }
    public void setLedgerWeight(BigDecimal ledgerWeight) { this.ledgerWeight = ledgerWeight; }
    public BigDecimal getActualWeight() { return actualWeight; }
    public void setActualWeight(BigDecimal actualWeight) { this.actualWeight = actualWeight; }
    public BigDecimal getDiffWeight() { return diffWeight; }
    public void setDiffWeight(BigDecimal diffWeight) { this.diffWeight = diffWeight; }
    public BigDecimal getDiffRate() { return diffRate; }
    public void setDiffRate(BigDecimal diffRate) { this.diffRate = diffRate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
