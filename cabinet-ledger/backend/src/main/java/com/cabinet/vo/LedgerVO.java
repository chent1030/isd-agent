package com.cabinet.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LedgerVO {
    private Long id;
    private String itemName;
    private String category;
    private String spec;
    private Integer slotNo;
    private Integer quantity;
    private BigDecimal totalWeight;
    private Integer operationType;
    private Integer status;
    private String storedBy;
    private LocalDateTime storedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getTotalWeight() { return totalWeight; }
    public void setTotalWeight(BigDecimal totalWeight) { this.totalWeight = totalWeight; }
    public Integer getOperationType() { return operationType; }
    public void setOperationType(Integer operationType) { this.operationType = operationType; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getStoredBy() { return storedBy; }
    public void setStoredBy(String storedBy) { this.storedBy = storedBy; }
    public LocalDateTime getStoredAt() { return storedAt; }
    public void setStoredAt(LocalDateTime storedAt) { this.storedAt = storedAt; }
}
