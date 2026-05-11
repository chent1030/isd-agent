package com.cabinet.service.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cabinet.dto.DoorOpenDTO;
import com.cabinet.entity.Cabinet;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.service.CabinetService;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.properties.CabinetLedgerProperties;
import com.cabinet.service.DoorControlService;
import com.cabinet.service.OperationLogService;
import com.cabinet.vo.DoorOpenVO;

@Service
public class DoorControlServiceImpl implements DoorControlService {
    private final CabinetSlotMapper cabinetSlotMapper;
    private final CabinetService cabinetService;
    private final OperationLogService operationLogService;
    private final CabinetLedgerProperties properties;

    public DoorControlServiceImpl(CabinetSlotMapper cabinetSlotMapper,
                                  CabinetService cabinetService,
                                  OperationLogService operationLogService,
                                  CabinetLedgerProperties properties) {
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.cabinetService = cabinetService;
        this.operationLogService = operationLogService;
        this.properties = properties;
    }

    @Override
    public DoorOpenVO openDoor(DoorOpenDTO dto, String ipAddr) {
        if (!StringUtils.hasText(dto.getCabinetId()) && dto.getCabinetNo() == null) {
            throw new IllegalArgumentException("柜号不能为空");
        }

        CabinetSlot slot = findSlot(dto);
        if (slot == null) {
            throw new IllegalArgumentException("未找到柜号对应的格口配置");
        }

        DoorOpenVO vo = new DoorOpenVO();
        vo.setCabinetId(slot.getCabinetId());
        vo.setSlotId(slot.getId());
        vo.setSlotNo(slot.getSlotNo());
        Cabinet cabinet = cabinetService.getById(slot.getCabinetId());
        if (cabinet != null) {
            vo.setCabinetNo(cabinet.getCabinetNo());
        }
        vo.setBoardAddr(slot.getBoardAddr());
        vo.setLockNumber(slot.getLockNumber());
        vo.setOpenedAt(LocalDateTime.now());

        if (properties.isHardwareDoorControlEnabled()) {
            // 硬件调用边界保留在服务层；实际 TCP/Node skill 适配在明确部署方式后接入。
            vo.setDoorStatus("pending");
            vo.setMessage("硬件开柜适配未配置，已记录开柜请求");
        } else {
            vo.setDoorStatus("simulated_opened");
            vo.setMessage("硬件开柜未启用，已完成模拟开柜");
        }

        String operator = StringUtils.hasText(dto.getOperator()) ? dto.getOperator() : "admin";
        String reason = StringUtils.hasText(dto.getReason()) ? dto.getReason() : "未填写";
        operationLogService.record(
                slot.getCabinetId(),
                operator,
                "DOOR_OPEN",
                "开柜原因：" + reason + "，格口：" + slot.getSlotNo() + "，板地址：" + slot.getBoardAddr() + "，锁号：" + slot.getLockNumber(),
                ipAddr
        );
        return vo;
    }

    private CabinetSlot findSlot(DoorOpenDTO dto) {
        String cabinetId = dto.getCabinetId();
        if (!StringUtils.hasText(cabinetId)) {
            Cabinet cabinet = cabinetService.getOne(
                    new LambdaQueryWrapper<Cabinet>()
                            .eq(Cabinet::getCabinetNo, dto.getCabinetNo())
                            .last("LIMIT 1")
            );
            if (cabinet == null) {
                return null;
            }
            cabinetId = cabinet.getId();
        }
        LambdaQueryWrapper<CabinetSlot> wrapper = new LambdaQueryWrapper<CabinetSlot>()
                .eq(CabinetSlot::getCabinetId, cabinetId)
                .orderByAsc(CabinetSlot::getSlotNo);
        if (dto.getSlotId() != null) {
            wrapper.eq(CabinetSlot::getId, dto.getSlotId());
        } else if (dto.getSlotNo() != null) {
            wrapper.eq(CabinetSlot::getSlotNo, dto.getSlotNo());
        }
        wrapper.last("LIMIT 1");
        return cabinetSlotMapper.selectOne(wrapper);
    }
}
