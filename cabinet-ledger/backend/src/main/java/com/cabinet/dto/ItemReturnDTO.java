package com.cabinet.dto;

public class ItemReturnDTO {
    private Long borrowRecordId;
    private Integer quantity;
    private String operatorNo;
    private String operatorName;
    private String remark;

    public Long getBorrowRecordId() { return borrowRecordId; }
    public void setBorrowRecordId(Long borrowRecordId) { this.borrowRecordId = borrowRecordId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getOperatorNo() { return operatorNo; }
    public void setOperatorNo(String operatorNo) { this.operatorNo = operatorNo; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
