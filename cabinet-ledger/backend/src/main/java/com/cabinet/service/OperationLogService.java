package com.cabinet.service;

public interface OperationLogService {
    void record(String cabinetId, String operator, String action, String detail, String ipAddr);
}
