package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.entity.Cabinet;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.service.CabinetService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.OperationLogService;
import com.cabinet.util.WeightUnitUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cabinet")
public class CabinetController {

    private final CabinetService cabinetService;
    private final CabinetSlotMapper cabinetSlotMapper;
    private final ItemStockService itemStockService;
    private final OperationLogService operationLogService;
    private final ExcelUtil excelUtil;

    public CabinetController(CabinetService cabinetService,
                             CabinetSlotMapper cabinetSlotMapper,
                             ItemStockService itemStockService,
                             OperationLogService operationLogService,
                             ExcelUtil excelUtil) {
        this.cabinetService = cabinetService;
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.itemStockService = itemStockService;
        this.operationLogService = operationLogService;
        this.excelUtil = excelUtil;
    }

    @GetMapping("/list")
    public Result<List<Cabinet>> list() {
        return Result.success(cabinetService.list());
    }

    @GetMapping("/detail")
    public Result<Cabinet> detail(@RequestParam String id) {
        return Result.success(cabinetService.getById(id));
    }

    @GetMapping("/slots")
    public Result<List<CabinetSlot>> slots(@RequestParam String cabinetId) {
        return Result.success(cabinetSlotMapper.selectByCabinetId(cabinetId));
    }

    @GetMapping("/slot/by-item")
    public Result<CabinetSlot> slotByItem(@RequestParam Long itemId) {
        if (itemId == null) {
            throw new IllegalArgumentException("物品ID不能为空");
        }
        CabinetSlot slot = cabinetSlotMapper.selectByItemId(itemId);
        if (slot == null) {
            throw new IllegalArgumentException("该物品未绑定格口");
        }
        Cabinet cabinet = cabinetService.getById(slot.getCabinetId());
        if (cabinet == null || cabinet.getStatus() == null || cabinet.getStatus() != 1) {
            throw new IllegalArgumentException("该物品绑定的柜子未启用");
        }
        return Result.success(slot);
    }

    @GetMapping("/slot/by-no")
    public Result<CabinetSlot> slotByNo(@RequestParam Integer cabinetNo,
                                        @RequestParam Integer slotNo) {
        if (cabinetNo == null) {
            throw new IllegalArgumentException("柜号不能为空");
        }
        if (slotNo == null) {
            throw new IllegalArgumentException("格口号不能为空");
        }
        Cabinet cabinet = cabinetService.getByCabinetNo(cabinetNo);
        if (cabinet == null || cabinet.getStatus() == null || cabinet.getStatus() != 1) {
            throw new IllegalArgumentException("柜子不存在或未启用");
        }
        CabinetSlot slot = cabinetSlotMapper.selectByCabinetIdAndSlotNo(cabinet.getId(), slotNo);
        if (slot == null) {
            throw new IllegalArgumentException("未找到柜号和格口号对应的格口配置");
        }
        return Result.success(slot);
    }

    @PostMapping("/slot/save")
    public Result<Boolean> saveSlot(@RequestBody CabinetSlot slot,
                                    @RequestHeader(value = "X-Operator", required = false) String operator,
                                    HttpServletRequest request) {
        validateSlot(slot);
        Cabinet cabinet = cabinetService.getById(slot.getCabinetId());
        if (cabinet == null) {
            throw new IllegalArgumentException("柜子不存在");
        }
        ensureSlotUnique(slot);
        CabinetSlot oldSlot = slot.getId() == null ? null : cabinetSlotMapper.selectById(slot.getId());
        boolean success = slot.getId() == null
                ? cabinetSlotMapper.insert(slot) > 0
                : cabinetSlotMapper.updateById(slot) > 0;
        if (success) {
            if (oldSlot != null && oldSlot.getItemId() != null && !oldSlot.getItemId().equals(slot.getItemId())) {
                itemStockService.clearSlotBinding(oldSlot.getItemId(), oldSlot.getId());
            }
            itemStockService.syncSlotBinding(slot);
            operationLogService.record(slot.getCabinetId(), operatorOrDefault(operator), "SLOT_SAVE",
                    "保存格口配置：" + slot.getSlotNo() + "，物品：" + slot.getItemId(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/save")
    public Result<Boolean> save(@RequestBody Cabinet cabinet,
                                @RequestHeader(value = "X-Operator", required = false) String operator,
                                HttpServletRequest request) {
        validateCabinet(cabinet);
        ensureCabinetNoUnique(cabinet);
        Cabinet existing = StringUtils.hasText(cabinet.getId()) ? cabinetService.getById(cabinet.getId()) : null;
        if (existing != null && existing.getStatus() != null && existing.getStatus() == 1) {
            if (cabinet.getStatus() == null || cabinet.getStatus() == 1) {
                throw new IllegalArgumentException("启用中的柜子不能编辑，请先停用");
            }
            existing.setStatus(cabinet.getStatus());
            cabinet = existing;
        }
        boolean success = cabinetService.saveOrUpdate(cabinet);
        if (success) {
            operationLogService.record(cabinet.getId(), operatorOrDefault(operator), "CABINET_SAVE",
                    "保存柜子配置：" + cabinet.getName(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/status")
    public Result<Boolean> updateStatus(@RequestParam String id,
                                        @RequestParam Integer status,
                                        @RequestHeader(value = "X-Operator", required = false) String operator,
                                        HttpServletRequest request) {
        Cabinet cabinet = cabinetService.getById(id);
        if (cabinet == null) {
            throw new IllegalArgumentException("柜子不存在");
        }
        cabinet.setStatus(status);
        boolean success = cabinetService.updateById(cabinet);
        if (success) {
            operationLogService.record(id, operatorOrDefault(operator), "CABINET_STATUS",
                    "修改柜子状态为：" + status, request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/delete")
    public Result<Boolean> delete(@RequestParam String id,
                                  @RequestHeader(value = "X-Operator", required = false) String operator,
                                  HttpServletRequest request) {
        Cabinet cabinet = cabinetService.getById(id);
        ensureCabinetEditable(cabinet, "启用中的柜子不能删除");
        boolean success = cabinetService.removeById(id);
        if (success) {
            operationLogService.record(id, operatorOrDefault(operator), "CABINET_DELETE",
                    "删除柜子：" + id, request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {
        excelUtil.exportCabinet(response);
    }

    private void validateCabinet(Cabinet cabinet) {
        if (cabinet == null) {
            throw new IllegalArgumentException("柜子配置不能为空");
        }
        if (!StringUtils.hasText(cabinet.getId())) {
            throw new IllegalArgumentException("ID不能为空");
        }
        if (cabinet.getCabinetNo() == null || cabinet.getCabinetNo() <= 0) {
            throw new IllegalArgumentException("柜号必须为正整数");
        }
    }

    private void validateSlot(CabinetSlot slot) {
        if (slot == null) {
            throw new IllegalArgumentException("格口配置不能为空");
        }
        if (!StringUtils.hasText(slot.getCabinetId())) {
            throw new IllegalArgumentException("柜子不能为空");
        }
        if (slot.getSlotNo() == null || slot.getSlotNo() <= 0) {
            throw new IllegalArgumentException("格口号必须为正整数");
        }
        if (slot.getItemId() == null) {
            slot.setItemQuantity(0);
        }
        if (slot.getItemQuantity() == null) {
            slot.setItemQuantity(0);
        }
        if (slot.getItemQuantity() < 0) {
            throw new IllegalArgumentException("格口物品数量不能为负数");
        }
        slot.setWeightLimit(WeightUnitUtil.zeroIfNullIntegerGram(slot.getWeightLimit(), "格口称重上限"));
    }

    private void ensureCabinetNoUnique(Cabinet cabinet) {
        String excludeId = StringUtils.hasText(cabinet.getId()) ? cabinet.getId() : null;
        if (cabinetService.countByCabinetNo(cabinet.getCabinetNo(), excludeId) > 0) {
            throw new IllegalArgumentException("柜号不能重复");
        }
    }

    private void ensureSlotUnique(CabinetSlot slot) {
        if (cabinetSlotMapper.countByCabinetSlotNo(slot.getCabinetId(), slot.getSlotNo(), slot.getId()) > 0) {
            throw new IllegalArgumentException("同一柜子的格口编号不能重复");
        }
    }

    private void ensureCabinetEditable(Cabinet cabinet, String message) {
        if (cabinet == null) {
            throw new IllegalArgumentException("柜子不存在");
        }
        if (cabinet.getStatus() != null && cabinet.getStatus() == 1) {
            throw new IllegalArgumentException(message);
        }
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }
}
