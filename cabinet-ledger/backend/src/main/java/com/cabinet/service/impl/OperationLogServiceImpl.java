package com.cabinet.service.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.cabinet.entity.OperationLog;
import com.cabinet.mapper.OperationLogMapper;
import com.cabinet.service.OperationLogService;

@Service
public class OperationLogServiceImpl implements OperationLogService {
    private final OperationLogMapper operationLogMapper;

    public OperationLogServiceImpl(OperationLogMapper operationLogMapper) {
        this.operationLogMapper = operationLogMapper;
    }

    @Override
    public void record(String cabinetId, String operator, String action, String detail, String ipAddr) {
        OperationLog log = new OperationLog();
        log.setCabinetId(cabinetId);
        log.setOperator(operator);
        log.setAction(action);
        log.setDetail(detail);
        log.setIpAddr(ipAddr);
        log.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(log);
    }
}
