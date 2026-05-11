package com.cabinet.mapper;

import com.cabinet.entity.OperationLog;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface OperationLogMapper {
    int insert(OperationLog log);

    List<OperationLog> selectLogList(@Param("cabinetId") String cabinetId,
                                     @Param("operator") String operator);
}
