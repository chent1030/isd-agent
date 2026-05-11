package com.cabinet.vo;

public class AvailableItemVO {
    private Long id;
    private String name;
    private String category;
    private String spec;
    private Integer useType;
    private Integer stock;
    private Integer cabinetNo;
    private Integer slotNo;

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
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
}
