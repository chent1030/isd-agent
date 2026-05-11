package com.cabinet.dto;

public class CabinetDTO {
    private String id;
    private Integer cabinetNo;
    private String name;
    private String location;
    private Integer status;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
