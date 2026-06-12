package com.cabinet.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ItemStockVO {
    private Long id;
    private String name;
    private String category;
    private String spec;
    private BigDecimal standardWeight;
    private Integer useType;
    private Integer authRequired;
    private Integer quantity;
    private Integer slotQuantity;
    private Integer borrowedQuantity;
    private BigDecimal ledgerWeight;
    private BigDecimal actualWeight;
    private Integer warningQuantity;
    private Integer maxQuantity;
    private Integer stockStatus;
    private String cabinetId;
    private Integer cabinetNo;
    private String cabinetName;
    private Long slotId;
    private Integer slotNo;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }
    public BigDecimal getStandardWeight() { return standardWeight; }
    public void setStandardWeight(BigDecimal standardWeight) { this.standardWeight = standardWeight; }
    public Integer getUseType() { return useType; }
    public void setUseType(Integer useType) { this.useType = useType; }
    public Integer getAuthRequired() { return authRequired; }
    public void setAuthRequired(Integer authRequired) { this.authRequired = authRequired; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getSlotQuantity() { return slotQuantity; }
    public void setSlotQuantity(Integer slotQuantity) { this.slotQuantity = slotQuantity; }
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
    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public String getCabinetName() { return cabinetName; }
    public void setCabinetName(String cabinetName) { this.cabinetName = cabinetName; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
