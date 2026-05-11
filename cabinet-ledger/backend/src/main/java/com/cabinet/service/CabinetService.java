package com.cabinet.service;

import com.cabinet.entity.Cabinet;

import java.util.List;

/**
 * 智能柜 Service 接口
 */
public interface CabinetService {
    List<Cabinet> list();

    Cabinet getById(String id);

    Cabinet getByCabinetNo(Integer cabinetNo);

    long countByCabinetNo(Integer cabinetNo, String excludeId);

    boolean saveOrUpdate(Cabinet cabinet);

    boolean updateById(Cabinet cabinet);

    boolean removeById(String id);
}
