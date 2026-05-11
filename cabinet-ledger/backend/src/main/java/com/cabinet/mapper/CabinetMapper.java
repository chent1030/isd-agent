package com.cabinet.mapper;

import com.cabinet.entity.Cabinet;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface CabinetMapper {
    List<Cabinet> selectAll();

    Cabinet selectById(@Param("id") String id);

    Cabinet selectByCabinetNo(@Param("cabinetNo") Integer cabinetNo);

    int countByCabinetNo(@Param("cabinetNo") Integer cabinetNo, @Param("excludeId") String excludeId);

    int insert(Cabinet cabinet);

    int updateById(Cabinet cabinet);

    int softDeleteById(@Param("id") String id);

    @Select("SELECT c.*, " +
            "(SELECT COUNT(*) FROM cabinet_slot cs WHERE cs.cabinet_id = c.id AND cs.deleted = 0) as slotCount, " +
            "(SELECT COUNT(*) FROM cabinet_slot cs WHERE cs.cabinet_id = c.id AND cs.status = 1 AND cs.deleted = 0) as occupiedSlots " +
            "FROM cabinet c WHERE c.id = #{id} AND c.deleted = 0")
    Cabinet selectCabinetWithStats(@Param("id") String id);
}
