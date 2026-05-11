package com.cabinet.enums;

import lombok.Getter;

@Getter
public enum SlotStatus {
    FREE(0, "空闲"),
    OCCUPIED(1, "占用"),
    FAULT(2, "故障");

    private final int code;
    private final String desc;

    SlotStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
