package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.entity.OperationLog;
import com.cabinet.mapper.OperationLogMapper;
import io.choerodon.core.domain.Page;
import io.choerodon.mybatis.pagehelper.PageHelper;
import io.choerodon.mybatis.pagehelper.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cabinet/log")
public class OperationLogController {

    private final OperationLogMapper operationLogMapper;

    public OperationLogController(OperationLogMapper operationLogMapper) {
        this.operationLogMapper = operationLogMapper;
    }

    @GetMapping("/list")
    public Result<Page<OperationLog>> list(
            @RequestParam(required = false) String cabinetId,
            @RequestParam(required = false) String operator,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        int current = page <= 0 ? 1 : page;
        int pageSize = size <= 0 ? 20 : size;
        Page<OperationLog> pageResult = PageHelper.doPage(new PageRequest(current - 1, pageSize),
                () -> operationLogMapper.selectLogList(cabinetId, operator));
        return Result.success(pageResult);
    }
}
