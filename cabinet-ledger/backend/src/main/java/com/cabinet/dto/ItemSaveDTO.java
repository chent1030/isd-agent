package com.cabinet.dto;

import java.math.BigDecimal;

public class ItemSaveDTO {
    private Long id;
    private String name;
    private String category;
    private String spec;
    private BigDecimal standardWeight;
    private Integer useType;
    private Integer warningQuantity;
    private Integer maxQuantity;
    private Integer authRequired;
    private Integer borrowerReminderHours;
    private Integer adminReminderHours;

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
    public Integer getWarningQuantity() { return warningQuantity; }
    public void setWarningQuantity(Integer warningQuantity) { this.warningQuantity = warningQuantity; }
    public Integer getMaxQuantity() { return maxQuantity; }
    public void setMaxQuantity(Integer maxQuantity) { this.maxQuantity = maxQuantity; }
    public Integer getAuthRequired() { return authRequired; }
    public void setAuthRequired(Integer authRequired) { this.authRequired = authRequired; }
    public Integer getBorrowerReminderHours() { return borrowerReminderHours; }
    public void setBorrowerReminderHours(Integer borrowerReminderHours) { this.borrowerReminderHours = borrowerReminderHours; }
    public Integer getAdminReminderHours() { return adminReminderHours; }
    public void setAdminReminderHours(Integer adminReminderHours) { this.adminReminderHours = adminReminderHours; }
}
