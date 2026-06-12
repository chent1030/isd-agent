package com.cabinet.mapper;

import com.cabinet.entity.ItemAuthorization;
import com.cabinet.vo.ItemAuthorizationVO;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface ItemAuthorizationMapper {
    ItemAuthorization selectById(@Param("id") Long id);

    int countValidAuthorization(@Param("itemId") Long itemId, @Param("employeeNo") String employeeNo);

    List<ItemAuthorizationVO> selectList(@Param("itemId") Long itemId, @Param("employeeNo") String employeeNo);

    int insert(ItemAuthorization authorization);

    int updateById(ItemAuthorization authorization);

    int deleteById(@Param("id") Long id);
}
