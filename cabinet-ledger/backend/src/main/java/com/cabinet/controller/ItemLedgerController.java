package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.common.PageResult;
import com.cabinet.dto.InventoryCheckDTO;
import com.cabinet.entity.ItemLedger;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.service.OperationLogService;
import com.cabinet.vo.InventoryCheckVO;
import com.cabinet.vo.LedgerVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;

import java.io.IOException;

@RestController
@RequestMapping("/cabinet/ledger")
public class ItemLedgerController {

    private final ItemLedgerService itemLedgerService;
    private final ExcelUtil excelUtil;
    private final OperationLogService operationLogService;

    public ItemLedgerController(ItemLedgerService itemLedgerService, ExcelUtil excelUtil, OperationLogService operationLogService) {
        this.itemLedgerService = itemLedgerService;
        this.excelUtil = excelUtil;
        this.operationLogService = operationLogService;
    }

    @GetMapping("/list")
    public Result<PageResult<LedgerVO>> list(
            @RequestParam(required = false) String cabinetId,
            @RequestParam(required = false) Integer operationType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResult<LedgerVO> result = itemLedgerService.getLedgerList(cabinetId, operationType, status, category, page, size);
        return Result.success(result);
    }

    @PostMapping("/save")
    public Result<Void> save(@RequestBody ItemLedger ledger,
                             @RequestHeader(value = "X-Operator", required = false) String operator,
                             HttpServletRequest request) {
        boolean success = itemLedgerService.saveLedger(ledger);
        if (success) {
            operationLogService.record(ledger.getCabinetId(), operatorOrDefault(operator), "LEDGER_SAVE", "保存台账记录：" + ledger.getId(), request.getRemoteAddr());
        }
        return success ? Result.success() : Result.error("保存失败");
    }

    @PostMapping("/update")
    public Result<Void> update(@RequestBody ItemLedger ledger,
                               @RequestHeader(value = "X-Operator", required = false) String operator,
                               HttpServletRequest request) {
        boolean success = itemLedgerService.updateLedger(ledger);
        if (success) {
            operationLogService.record(ledger.getCabinetId(), operatorOrDefault(operator), "LEDGER_UPDATE", "更新台账记录：" + ledger.getId(), request.getRemoteAddr());
        }
        return success ? Result.success() : Result.error("更新失败");
    }

    @PostMapping("/inventory/check")
    public Result<InventoryCheckVO> inventoryCheck(@RequestBody InventoryCheckDTO dto) {
        InventoryCheckVO vo = itemLedgerService.checkInventory(dto);
        return Result.success(vo);
    }

    // ==================== 导入导出 ====================

    @GetMapping("/export")
    public void export(
            @RequestParam(required = false) String cabinetId,
            @RequestParam(required = false) Integer operationType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String category,
            HttpServletResponse response) throws IOException {
        excelUtil.exportLedger(cabinetId, operationType, status, category, response);
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }
}
