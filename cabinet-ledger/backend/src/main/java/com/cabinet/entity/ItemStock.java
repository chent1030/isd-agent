package com.cabinet.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ItemStock {
    private Long id;
    private Long itemId;
    private String cabinetId;
    private Long slotId;
    private Integer quantity;
    private Integer borrowedQuantity;
    private BigDecimal ledgerWeight;
    private BigDecimal actualWeight;
    private Integer warningQuantity;
    private Integer maxQuantity;
    private Integer stockStatus;
    private LocalDateTime updatedAt;
    private Integer deleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getBorrowedQuantity() { return borrowedQuantity; }
    public void setBorrowedQuantity(Integer borrowedQuantity) { this.borrowedQuantity = borrowedQuantity; }
    public BigDecimal getLedgerWeight() { return ledgerWeight; }
    public void setLedgerWeight(BigDecimal ledgerWeight) { this.ledgerWeight = ledgerWeight; }
    public BigDecimal getActualWeight() { return actualWeight; }
    public void setActualWeight(BigDecimal actualWeight) { this.actualWeight = actualWeight; }
    public Integer getWarningQuantity() { return warningQuantity; }
    public void setWarningQuantity(Integer warningQuantity) { this.warningQuantity = warningQuantity; }
    public Integer getMaxQuantity() { return maxQuantity; }
    public void setMaxQuantity(Integer maxQuantity) { this.maxQuantity = maxQuantity; }
    public Integer getStockStatus() { return stockStatus; }
    public void setStockStatus(Integer stockStatus) { this.stockStatus = stockStatus; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}
