package com.cabinet.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cabinet.common.Result;
import com.cabinet.dto.AdminUserDTO;
import com.cabinet.entity.AdminUser;
import com.cabinet.mapper.AdminUserMapper;
import com.cabinet.service.OperationLogService;
import com.cabinet.util.PasswordUtil;
import com.cabinet.vo.AdminUserVO;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/cabinet/admin-user")
public class AdminUserController {
    private final AdminUserMapper adminUserMapper;
    private final OperationLogService operationLogService;

    public AdminUserController(AdminUserMapper adminUserMapper, OperationLogService operationLogService) {
        this.adminUserMapper = adminUserMapper;
        this.operationLogService = operationLogService;
    }

    @GetMapping("/list")
    public Result<List<AdminUserVO>> list() {
        List<AdminUserVO> list = adminUserMapper.selectAll().stream().map(this::toVO).collect(Collectors.toList());
        return Result.success(list);
    }

    @PostMapping("/save")
    public Result<Boolean> save(@RequestBody AdminUserDTO dto,
                                @RequestHeader(value = "X-Operator", required = false) String operator,
                                HttpServletRequest request) {
        if (!StringUtils.hasText(dto.getUsername())) {
            throw new IllegalArgumentException("账号不能为空");
        }

        AdminUser user = dto.getId() == null ? new AdminUser() : adminUserMapper.selectById(dto.getId());
        if (user == null) {
            throw new IllegalArgumentException("账号不存在");
        }
        user.setUsername(dto.getUsername());
        user.setDisplayName(dto.getDisplayName());
        user.setStatus(dto.getStatus() == null ? 1 : dto.getStatus());
        user.setUpdatedAt(LocalDateTime.now());

        if (StringUtils.hasText(dto.getPassword())) {
            String salt = PasswordUtil.newSalt();
            user.setSalt(salt);
            user.setPasswordHash(PasswordUtil.hash(dto.getPassword(), salt));
        } else if (dto.getId() == null) {
            throw new IllegalArgumentException("新增账号必须设置密码");
        }

        boolean success;
        if (dto.getId() == null) {
            user.setCreatedAt(LocalDateTime.now());
            success = adminUserMapper.insert(user) > 0;
        } else {
            success = adminUserMapper.updateById(user) > 0;
        }

        if (success) {
            operationLogService.record(null, operatorOrDefault(operator), "ADMIN_USER_SAVE", "保存管理员账号：" + user.getUsername(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }

    private AdminUserVO toVO(AdminUser user) {
        AdminUserVO vo = new AdminUserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setDisplayName(user.getDisplayName());
        vo.setStatus(user.getStatus());
        vo.setLastLoginAt(user.getLastLoginAt());
        return vo;
    }
}
