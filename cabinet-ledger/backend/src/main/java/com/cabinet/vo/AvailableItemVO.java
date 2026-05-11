package com.cabinet.vo;

public class AvailableItemVO {
    private Long id;
    private String name;
    private Integer stock;
    private Integer cabinetNo;
    private Integer slotNo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
}
