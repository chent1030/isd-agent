package com.cabinet.dto;

public class SlotDTO {
    private Long id;
    private String cabinetId;
    private Integer slotNo;
    private Long itemId;
    private java.math.BigDecimal weightLimit;
    private Integer status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public java.math.BigDecimal getWeightLimit() { return weightLimit; }
    public void setWeightLimit(java.math.BigDecimal weightLimit) { this.weightLimit = weightLimit; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
