package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.dto.ItemAuthorizationSaveDTO;
import com.cabinet.entity.ItemAuthorization;
import com.cabinet.mapper.ItemAuthorizationMapper;
import com.cabinet.service.OperationLogService;
import com.cabinet.vo.ItemAuthorizationVO;
import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cabinet/item-auth")
public class ItemAuthorizationController {
    private final ItemAuthorizationMapper authorizationMapper;
    private final OperationLogService operationLogService;

    public ItemAuthorizationController(ItemAuthorizationMapper authorizationMapper,
                                       OperationLogService operationLogService) {
        this.authorizationMapper = authorizationMapper;
        this.operationLogService = operationLogService;
    }

    @GetMapping("/list")
    public Result<List<ItemAuthorizationVO>> list(@RequestParam(required = false) Long itemId,
                                                  @RequestParam(required = false) String employeeNo) {
        return Result.success(authorizationMapper.selectList(itemId, employeeNo));
    }

    @PostMapping("/save")
    public Result<Boolean> save(@RequestBody ItemAuthorizationSaveDTO dto,
                                @RequestHeader(value = "X-Operator", required = false) String operator,
                                HttpServletRequest request) {
        ItemAuthorization authorization = toEntity(dto);
        boolean success = authorization.getId() == null
                ? authorizationMapper.insert(authorization) > 0
                : authorizationMapper.updateById(authorization) > 0;
        if (success) {
            operationLogService.record(null, operatorOrDefault(operator), "ITEM_AUTH_SAVE",
                    "保存物品授权：" + authorization.getEmployeeNo() + " -> " + authorization.getItemId(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/delete")
    public Result<Boolean> delete(@RequestParam Long id,
                                  @RequestHeader(value = "X-Operator", required = false) String operator,
                                  HttpServletRequest request) {
        boolean success = authorizationMapper.deleteById(id) > 0;
        if (success) {
            operationLogService.record(null, operatorOrDefault(operator), "ITEM_AUTH_DELETE",
                    "删除物品授权：" + id, request.getRemoteAddr());
        }
        return Result.success(success);
    }

    private ItemAuthorization toEntity(ItemAuthorizationSaveDTO dto) {
        if (dto == null || dto.getItemId() == null) {
            throw new IllegalArgumentException("物品不能为空");
        }
        if (!StringUtils.hasText(dto.getEmployeeNo())) {
            throw new IllegalArgumentException("人员工号不能为空");
        }
        if (dto.getValidFrom() != null && dto.getValidTo() != null && dto.getValidFrom().isAfter(dto.getValidTo())) {
            throw new IllegalArgumentException("授权开始时间不能晚于结束时间");
        }
        LocalDateTime now = LocalDateTime.now();
        ItemAuthorization authorization = new ItemAuthorization();
        authorization.setId(dto.getId());
        authorization.setItemId(dto.getItemId());
        authorization.setEmployeeNo(dto.getEmployeeNo());
        authorization.setEmployeeName(dto.getEmployeeName());
        authorization.setValidFrom(dto.getValidFrom());
        authorization.setValidTo(dto.getValidTo());
        authorization.setEnabled(dto.getEnabled() == null ? 1 : dto.getEnabled());
        authorization.setRemark(dto.getRemark());
        authorization.setCreatedAt(now);
        authorization.setUpdatedAt(now);
        return authorization;
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }
}
