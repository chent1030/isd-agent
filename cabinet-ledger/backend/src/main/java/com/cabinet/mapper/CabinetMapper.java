package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cabinet.entity.Cabinet;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface CabinetMapper extends BaseMapper<Cabinet> {

    @Select("SELECT c.*, " +
            "(SELECT COUNT(*) FROM cabinet_slot cs WHERE cs.cabinet_id = c.id AND cs.deleted = 0) as slotCount, " +
            "(SELECT COUNT(*) FROM cabinet_slot cs WHERE cs.cabinet_id = c.id AND cs.status = 1 AND cs.deleted = 0) as occupiedSlots " +
            "FROM cabinet c WHERE c.id = #{id} AND c.deleted = 0")
    Cabinet selectCabinetWithStats(@Param("id") String id);
}
