package com.cabinet.enums;

import lombok.Getter;

@Getter
public enum LedgerStatus {
    IN_STOCK(0, "在库"),
    REMOVED(1, "已取出");

    private final int code;
    private final String desc;

    LedgerStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
