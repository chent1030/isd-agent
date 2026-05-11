package com.cabinet.util;

import java.math.BigDecimal;

public final class WeightUnitUtil {
    private WeightUnitUtil() {
    }

    public static BigDecimal requireIntegerGram(BigDecimal value, String fieldName) {
        if (value == null) {
            return null;
        }
        BigDecimal normalized = value.stripTrailingZeros();
        if (normalized.scale() > 0) {
            throw new IllegalArgumentException(fieldName + "必须是整数克");
        }
        if (value.signum() < 0) {
            throw new IllegalArgumentException(fieldName + "不能为负数");
        }
        return value.setScale(0);
    }

    public static BigDecimal zeroIfNullIntegerGram(BigDecimal value, String fieldName) {
        BigDecimal normalized = requireIntegerGram(value, fieldName);
        return normalized == null ? BigDecimal.ZERO : normalized;
    }
}
