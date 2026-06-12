package com.cabinet.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CabinetSlot {
    private Long id;
    private String cabinetId;
    private Integer slotNo;
    private Long itemId;
    private String boardAddr;
    private String lockNumber;
    private String sensorId;
    private BigDecimal weightLimit;
    private Integer itemQuantity;
    private Integer status;
    private LocalDateTime createdAt;
    private Integer deleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getBoardAddr() { return boardAddr; }
    public void setBoardAddr(String boardAddr) { this.boardAddr = boardAddr; }
    public String getLockNumber() { return lockNumber; }
    public void setLockNumber(String lockNumber) { this.lockNumber = lockNumber; }
    public String getSensorId() { return sensorId; }
    public void setSensorId(String sensorId) { this.sensorId = sensorId; }
    public BigDecimal getWeightLimit() { return weightLimit; }
    public void setWeightLimit(BigDecimal weightLimit) { this.weightLimit = weightLimit; }
    public Integer getItemQuantity() { return itemQuantity; }
    public void setItemQuantity(Integer itemQuantity) { this.itemQuantity = itemQuantity; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}
