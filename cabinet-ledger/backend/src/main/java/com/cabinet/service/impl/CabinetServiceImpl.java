package com.cabinet.service.impl;

import com.cabinet.entity.Cabinet;
import com.cabinet.mapper.CabinetMapper;
import com.cabinet.service.CabinetService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CabinetServiceImpl implements CabinetService {
    private final CabinetMapper cabinetMapper;

    public CabinetServiceImpl(CabinetMapper cabinetMapper) {
        this.cabinetMapper = cabinetMapper;
    }

    @Override
    public List<Cabinet> list() {
        return cabinetMapper.selectAll();
    }

    @Override
    public Cabinet getById(String id) {
        return cabinetMapper.selectById(id);
    }

    @Override
    public Cabinet getByCabinetNo(Integer cabinetNo) {
        return cabinetMapper.selectByCabinetNo(cabinetNo);
    }

    @Override
    public long countByCabinetNo(Integer cabinetNo, String excludeId) {
        return cabinetMapper.countByCabinetNo(cabinetNo, excludeId);
    }

    @Override
    public boolean saveOrUpdate(Cabinet cabinet) {
        LocalDateTime now = LocalDateTime.now();
        if (cabinet.getCreatedAt() == null) {
            cabinet.setCreatedAt(now);
        }
        cabinet.setUpdatedAt(now);
        if (cabinet.getDeleted() == null) {
            cabinet.setDeleted(0);
        }
        if (getById(cabinet.getId()) == null) {
            return cabinetMapper.insert(cabinet) > 0;
        }
        return cabinetMapper.updateById(cabinet) > 0;
    }

    @Override
    public boolean updateById(Cabinet cabinet) {
        cabinet.setUpdatedAt(LocalDateTime.now());
        return cabinetMapper.updateById(cabinet) > 0;
    }

    @Override
    public boolean removeById(String id) {
        return cabinetMapper.softDeleteById(id) > 0;
    }
}
