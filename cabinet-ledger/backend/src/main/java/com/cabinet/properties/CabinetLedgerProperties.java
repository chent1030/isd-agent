package com.cabinet.properties;

import java.math.BigDecimal;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cabinet-ledger")
public class CabinetLedgerProperties {
    private BigDecimal weightChangeThreshold = new BigDecimal("5");
    private boolean hardwareDoorControlEnabled = false;

    public BigDecimal getWeightChangeThreshold() { return weightChangeThreshold; }
    public void setWeightChangeThreshold(BigDecimal weightChangeThreshold) { this.weightChangeThreshold = weightChangeThreshold; }
    public boolean isHardwareDoorControlEnabled() { return hardwareDoorControlEnabled; }
    public void setHardwareDoorControlEnabled(boolean hardwareDoorControlEnabled) { this.hardwareDoorControlEnabled = hardwareDoorControlEnabled; }
}
