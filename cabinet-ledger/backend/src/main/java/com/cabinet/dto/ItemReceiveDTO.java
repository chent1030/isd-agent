package com.cabinet.dto;

public class ItemReceiveDTO {
    private Long itemId;
    private Integer quantity;
    private java.util.List<CabinetOperationLocationDTO> locations;
    private String operatorNo;
    private String operatorName;
    private String remark;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public java.util.List<CabinetOperationLocationDTO> getLocations() { return locations; }
    public void setLocations(java.util.List<CabinetOperationLocationDTO> locations) { this.locations = locations; }
    public String getOperatorNo() { return operatorNo; }
    public void setOperatorNo(String operatorNo) { this.operatorNo = operatorNo; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
