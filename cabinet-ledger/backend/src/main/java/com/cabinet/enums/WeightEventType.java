package com.cabinet.enums;

import lombok.Getter;

@Getter
public enum WeightEventType {
    PERIODIC(0, "定时采集"),
    INCREASE(1, "增加"),
    DECREASE(2, "减少");

    private final int code;
    private final String desc;

    WeightEventType(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
