package com.cabinet.dto;

import java.time.LocalDateTime;

public class ItemBorrowDTO {
    private Long itemId;
    private Integer quantity;
    private java.util.List<CabinetOperationLocationDTO> locations;
    private String borrower;
    private String operatorNo;
    private String operatorName;
    private LocalDateTime expectedReturnTime;
    private Integer borrowerReminderHours;
    private Integer adminReminderHours;
    private String remark;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public java.util.List<CabinetOperationLocationDTO> getLocations() { return locations; }
    public void setLocations(java.util.List<CabinetOperationLocationDTO> locations) { this.locations = locations; }
    public String getBorrower() { return borrower; }
    public void setBorrower(String borrower) { this.borrower = borrower; }
    public String getOperatorNo() { return operatorNo; }
    public void setOperatorNo(String operatorNo) { this.operatorNo = operatorNo; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }
    public LocalDateTime getExpectedReturnTime() { return expectedReturnTime; }
    public void setExpectedReturnTime(LocalDateTime expectedReturnTime) { this.expectedReturnTime = expectedReturnTime; }
    public Integer getBorrowerReminderHours() { return borrowerReminderHours; }
    public void setBorrowerReminderHours(Integer borrowerReminderHours) { this.borrowerReminderHours = borrowerReminderHours; }
    public Integer getAdminReminderHours() { return adminReminderHours; }
    public void setAdminReminderHours(Integer adminReminderHours) { this.adminReminderHours = adminReminderHours; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
