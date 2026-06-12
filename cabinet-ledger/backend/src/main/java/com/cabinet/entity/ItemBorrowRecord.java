package com.cabinet.entity;

import java.time.LocalDateTime;

public class ItemBorrowRecord {
    private Long id;
    private Long itemId;
    private String cabinetId;
    private Long slotId;
    private Integer quantity;
    private Integer returnedQuantity;
    private String borrower;
    private String borrowOperator;
    private String borrowOperatorNo;
    private String borrowOperatorName;
    private String returnOperator;
    private String returnOperatorNo;
    private String returnOperatorName;
    private LocalDateTime borrowTime;
    private LocalDateTime expectedReturnTime;
    private Integer borrowerReminderHours;
    private Integer adminReminderHours;
    private LocalDateTime borrowerRemindedAt;
    private LocalDateTime adminRemindedAt;
    private LocalDateTime returnTime;
    private Integer status;
    private String remark;
    private LocalDateTime createdAt;
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
    public Integer getReturnedQuantity() { return returnedQuantity; }
    public void setReturnedQuantity(Integer returnedQuantity) { this.returnedQuantity = returnedQuantity; }
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
    public Integer getBorrowerReminderHours() { return borrowerReminderHours; }
    public void setBorrowerReminderHours(Integer borrowerReminderHours) { this.borrowerReminderHours = borrowerReminderHours; }
    public Integer getAdminReminderHours() { return adminReminderHours; }
    public void setAdminReminderHours(Integer adminReminderHours) { this.adminReminderHours = adminReminderHours; }
    public LocalDateTime getBorrowerRemindedAt() { return borrowerRemindedAt; }
    public void setBorrowerRemindedAt(LocalDateTime borrowerRemindedAt) { this.borrowerRemindedAt = borrowerRemindedAt; }
    public LocalDateTime getAdminRemindedAt() { return adminRemindedAt; }
    public void setAdminRemindedAt(LocalDateTime adminRemindedAt) { this.adminRemindedAt = adminRemindedAt; }
    public LocalDateTime getReturnTime() { return returnTime; }
    public void setReturnTime(LocalDateTime returnTime) { this.returnTime = returnTime; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}
