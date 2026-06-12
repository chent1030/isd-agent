package com.cabinet.vo;

public class AvailableItemVO {
    private Long id;
    private String name;
    private String category;
    private String spec;
    private Integer useType;
    private Integer stock;
    private Integer itemStock;
    private Integer slotQuantity;
    private Integer cabinetQuantity;
    private Boolean authRequired;
    private Boolean authorized;
    private Integer borrowerReminderHours;
    private Integer adminReminderHours;
    private Integer cabinetNo;
    private String cabinetName;
    private Integer slotNo;
    private Long slotId;
    private Boolean enabled;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }
    public Integer getUseType() { return useType; }
    public void setUseType(Integer useType) { this.useType = useType; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public Integer getItemStock() { return itemStock; }
    public void setItemStock(Integer itemStock) { this.itemStock = itemStock; }
    public Integer getSlotQuantity() { return slotQuantity; }
    public void setSlotQuantity(Integer slotQuantity) { this.slotQuantity = slotQuantity; }
    public Integer getCabinetQuantity() { return cabinetQuantity; }
    public void setCabinetQuantity(Integer cabinetQuantity) { this.cabinetQuantity = cabinetQuantity; }
    public Boolean getAuthRequired() { return authRequired; }
    public void setAuthRequired(Boolean authRequired) { this.authRequired = authRequired; }
    public Boolean getAuthorized() { return authorized; }
    public void setAuthorized(Boolean authorized) { this.authorized = authorized; }
    public Integer getBorrowerReminderHours() { return borrowerReminderHours; }
    public void setBorrowerReminderHours(Integer borrowerReminderHours) { this.borrowerReminderHours = borrowerReminderHours; }
    public Integer getAdminReminderHours() { return adminReminderHours; }
    public void setAdminReminderHours(Integer adminReminderHours) { this.adminReminderHours = adminReminderHours; }
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public String getCabinetName() { return cabinetName; }
    public void setCabinetName(String cabinetName) { this.cabinetName = cabinetName; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
