package com.cabinet.vo;

import java.time.LocalDateTime;

public class ItemBorrowRecordVO {
    private Long id;
    private Long itemId;
    private String itemName;
    private String category;
    private String spec;
    private String cabinetId;
    private Integer cabinetNo;
    private String cabinetName;
    private Long slotId;
    private Integer slotNo;
    private Integer quantity;
    private Integer returnedQuantity;
    private Integer pendingQuantity;
    private String borrower;
    private String borrowOperator;
    private String borrowOperatorNo;
    private String borrowOperatorName;
    private String returnOperator;
    private String returnOperatorNo;
    private String returnOperatorName;
    private LocalDateTime borrowTime;
    private LocalDateTime expectedReturnTime;
    private LocalDateTime returnTime;
    private Integer status;
    private String remark;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }
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
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getReturnedQuantity() { return returnedQuantity; }
    public void setReturnedQuantity(Integer returnedQuantity) { this.returnedQuantity = returnedQuantity; }
    public Integer getPendingQuantity() { return pendingQuantity; }
    public void setPendingQuantity(Integer pendingQuantity) { this.pendingQuantity = pendingQuantity; }
    public String getBorrower() { return borrower; }
    public void setBorrower(String borrower) { this.borrower = borrower; }
    public String getBorrowOperator() { return borrowOperator; }
    public void setBorrowOperator(String borrowOperator) { this.borrowOperator = borrowOperator; }
    public String getBorrowOperatorNo() { return borrowOperatorNo; }
    public void setBorrowOperatorNo(String borrowOperatorNo) { this.borrowOperatorNo = borrowOperatorNo; }
    public String getBorrowOperatorName() { return borrowOperatorName; }
    public void setBorrowOperatorName(String borrowOperatorName) { this.borrowOperatorName = borrowOperatorName; }
    public String getReturnOperator() { return returnOperator; }
    public void setReturnOperator(String returnOperator) { this.returnOperator = returnOperator; }
    public String getReturnOperatorNo() { return returnOperatorNo; }
    public void setReturnOperatorNo(String returnOperatorNo) { this.returnOperatorNo = returnOperatorNo; }
    public String getReturnOperatorName() { return returnOperatorName; }
    public void setReturnOperatorName(String returnOperatorName) { this.returnOperatorName = returnOperatorName; }
    public LocalDateTime getBorrowTime() { return borrowTime; }
    public void setBorrowTime(LocalDateTime borrowTime) { this.borrowTime = borrowTime; }
    public LocalDateTime getExpectedReturnTime() { return expectedReturnTime; }
    public void setExpectedReturnTime(LocalDateTime expectedReturnTime) { this.expectedReturnTime = expectedReturnTime; }
    public LocalDateTime getReturnTime() { return returnTime; }
    public void setReturnTime(LocalDateTime returnTime) { this.returnTime = returnTime; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
