package com.cabinet.dto;

public class BorrowReminderMarkDTO {
    private Long borrowRecordId;
    private String reminderType;

    public Long getBorrowRecordId() { return borrowRecordId; }
    public void setBorrowRecordId(Long borrowRecordId) { this.borrowRecordId = borrowRecordId; }
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
}
