package com.cabinet.vo;

import java.time.LocalDateTime;

public class DoorOpenVO {
    private String cabinetId;
    private Integer cabinetNo;
    private Long slotId;
    private Integer slotNo;
    private String doorStatus;
    private String boardAddr;
    private String lockNumber;
    private LocalDateTime openedAt;
    private String message;

    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }
    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
    public String getDoorStatus() { return doorStatus; }
    public void setDoorStatus(String doorStatus) { this.doorStatus = doorStatus; }
    public String getBoardAddr() { return boardAddr; }
    public void setBoardAddr(String boardAddr) { this.boardAddr = boardAddr; }
    public String getLockNumber() { return lockNumber; }
    public void setLockNumber(String lockNumber) { this.lockNumber = lockNumber; }
    public LocalDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
