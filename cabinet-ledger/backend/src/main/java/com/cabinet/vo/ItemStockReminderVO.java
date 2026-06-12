package com.cabinet.vo;

public class ItemStockReminderVO {
    private String reminderType;
    private Long itemId;
    private String itemName;
    private String category;
    private String spec;
    private Integer quantity;
    private Integer warningQuantity;
    private String cabinetId;
    private Integer cabinetNo;
    private String cabinetName;
    private Long slotId;
    private Integer slotNo;
    private Integer slotQuantity;
    private String message;

    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getWarningQuantity() { return warningQuantity; }
    public void setWarningQuantity(Integer warningQuantity) { this.warningQuantity = warningQuantity; }
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
    public Integer getSlotQuantity() { return slotQuantity; }
    public void setSlotQuantity(Integer slotQuantity) { this.slotQuantity = slotQuantity; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
