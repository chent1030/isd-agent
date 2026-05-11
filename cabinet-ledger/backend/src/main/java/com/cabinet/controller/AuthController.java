package com.cabinet.controller;

import java.time.LocalDateTime;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cabinet.common.Result;
import com.cabinet.dto.LoginDTO;
import com.cabinet.entity.AdminUser;
import com.cabinet.mapper.AdminUserMapper;
import com.cabinet.service.OperationLogService;
import com.cabinet.util.PasswordUtil;
import com.cabinet.vo.AdminUserVO;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AdminUserMapper adminUserMapper;
    private final OperationLogService operationLogService;

    public AuthController(AdminUserMapper adminUserMapper, OperationLogService operationLogService) {
        this.adminUserMapper = adminUserMapper;
        this.operationLogService = operationLogService;
    }

    @PostMapping("/login")
    public Result<AdminUserVO> login(@RequestBody LoginDTO dto, HttpServletRequest request) {
        if (!StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getPassword())) {
            throw new IllegalArgumentException("账号和密码不能为空");
        }

        AdminUser user = adminUserMapper.selectByUsername(dto.getUsername());
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new IllegalArgumentException("账号不存在或已停用");
        }
        String hash = PasswordUtil.hash(dto.getPassword(), user.getSalt());
        if (!hash.equals(user.getPasswordHash())) {
            throw new IllegalArgumentException("账号或密码错误");
        }

        user.setLastLoginAt(LocalDateTime.now());
        adminUserMapper.updateById(user);
        operationLogService.record(null, user.getUsername(), "LOGIN", "管理员登录", request.getRemoteAddr());
        return Result.success(toVO(user));
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
