package com.cabinet.vo;

import java.util.ArrayList;
import java.util.List;

public class CabinetOperationVO {
    private Long itemId;
    private String itemName;
    private String action;
    private Integer quantity;
    private Integer remainingStock;
    private List<Location> locations = new ArrayList<>();

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getRemainingStock() { return remainingStock; }
    public void setRemainingStock(Integer remainingStock) { this.remainingStock = remainingStock; }
    public List<Location> getLocations() { return locations; }
    public void setLocations(List<Location> locations) { this.locations = locations; }

    public static class Location {
        private Long slotId;
        private String cabinetId;
        private Integer cabinetNo;
        private String cabinetName;
        private Integer slotNo;
        private Integer quantity;
        private Integer remainingSlotQuantity;

        public Long getSlotId() { return slotId; }
        public void setSlotId(Long slotId) { this.slotId = slotId; }
        public String getCabinetId() { return cabinetId; }
        public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
        public Integer getCabinetNo() { return cabinetNo; }
        public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
        public String getCabinetName() { return cabinetName; }
        public void setCabinetName(String cabinetName) { this.cabinetName = cabinetName; }
        public Integer getSlotNo() { return slotNo; }
        public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Integer getRemainingSlotQuantity() { return remainingSlotQuantity; }
        public void setRemainingSlotQuantity(Integer remainingSlotQuantity) { this.remainingSlotQuantity = remainingSlotQuantity; }
    }
}
