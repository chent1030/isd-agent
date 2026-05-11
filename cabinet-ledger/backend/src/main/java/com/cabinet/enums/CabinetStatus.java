package com.cabinet.enums;

import lombok.Getter;

@Getter
public enum CabinetStatus {
    DISABLED(0, "停用"),
    ENABLED(1, "启用"),
    MAINTENANCE(2, "维护中");

    private final int code;
    private final String desc;

    CabinetStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
