package com.cabinet.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.cabinet.common.Result;
import com.cabinet.entity.OperationLog;
import com.cabinet.mapper.OperationLogMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/cabinet/log")
public class OperationLogController {

    private final OperationLogMapper operationLogMapper;

    public OperationLogController(OperationLogMapper operationLogMapper) {
        this.operationLogMapper = operationLogMapper;
    }

    @GetMapping("/list")
    public Result<List<OperationLog>> list(
            @RequestParam(required = false) String cabinetId,
            @RequestParam(required = false) String operator,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(cabinetId != null && !cabinetId.isEmpty(), OperationLog::getCabinetId, cabinetId)
               .eq(operator != null && !operator.isEmpty(), OperationLog::getOperator, operator)
               .orderByDesc(OperationLog::getCreatedAt);

        Page<OperationLog> pageParam = new Page<>(page, size);
        Page<OperationLog> resultPage = operationLogMapper.selectPage(pageParam, wrapper);
        return Result.success(resultPage.getRecords());
    }
}
