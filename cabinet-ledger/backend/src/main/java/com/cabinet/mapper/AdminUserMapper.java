package com.cabinet.mapper;

import com.cabinet.entity.AdminUser;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface AdminUserMapper {
    List<AdminUser> selectAll();

    AdminUser selectById(@Param("id") Long id);

    AdminUser selectByUsername(@Param("username") String username);

    int insert(AdminUser user);

    int updateById(AdminUser user);
}
