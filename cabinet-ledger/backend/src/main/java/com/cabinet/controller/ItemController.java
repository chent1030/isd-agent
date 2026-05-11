package com.cabinet.controller;

import java.util.List;
import java.io.IOException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.StringUtils;

import com.cabinet.common.Result;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cabinet.dto.ItemReceiveDTO;
import com.cabinet.dto.ItemSaveDTO;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.ItemStock;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.OperationLogService;
import com.cabinet.util.WeightUnitUtil;
import com.cabinet.vo.AvailableItemVO;
import com.cabinet.vo.ItemStockVO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/cabinet/item")
public class ItemController {
    private final ItemMapper itemMapper;
    private final CabinetSlotMapper cabinetSlotMapper;
    private final ItemStockService itemStockService;
    private final ItemLedgerService itemLedgerService;
    private final OperationLogService operationLogService;
    private final ExcelUtil excelUtil;

    public ItemController(ItemMapper itemMapper,
                          CabinetSlotMapper cabinetSlotMapper,
                          ItemStockService itemStockService,
                          ItemLedgerService itemLedgerService,
                          OperationLogService operationLogService,
                          ExcelUtil excelUtil) {
        this.itemMapper = itemMapper;
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.itemStockService = itemStockService;
        this.itemLedgerService = itemLedgerService;
        this.operationLogService = operationLogService;
        this.excelUtil = excelUtil;
    }

    @GetMapping("/list")
    public Result<List<ItemStockVO>> list() {
        return Result.success(itemMapper.selectItemStockList());
    }

    @GetMapping("/available")
    public Result<List<AvailableItemVO>> available() {
        return Result.success(itemMapper.selectAvailableItems());
    }

    @PostMapping("/receive")
    public Result<ItemStock> receive(@RequestBody ItemReceiveDTO dto,
                                     @RequestHeader(value = "X-Operator", required = false) String operator,
                                     HttpServletRequest request) {
        Item item = validateReceive(dto);
        CabinetSlot slot = cabinetSlotMapper.selectOne(new LambdaQueryWrapper<CabinetSlot>()
                .eq(CabinetSlot::getItemId, dto.getItemId())
                .last("LIMIT 1"));
        if (slot == null) {
            throw new IllegalArgumentException("物品未绑定柜子格口");
        }
        ItemStock stock = itemStockService.getStockByItemId(dto.getItemId());
        int currentQuantity = stock == null || stock.getQuantity() == null ? 0 : stock.getQuantity();
        int quantity = dto.getQuantity();
        if (currentQuantity < quantity) {
            throw new IllegalArgumentException("库存不足，当前库存：" + currentQuantity);
        }

        ItemLedger ledger = new ItemLedger();
        ledger.setItemId(item.getId());
        ledger.setCabinetId(slot.getCabinetId());
        ledger.setSlotId(slot.getId());
        ledger.setQuantity(quantity);
        ledger.setTotalWeight(WeightUnitUtil.zeroIfNullIntegerGram(item.getStandardWeight(), "标准重量")
                .multiply(java.math.BigDecimal.valueOf(quantity)));
        ledger.setOperationType(1);
        ledger.setStatus(1);
        ledger.setOperatorNo(StringUtils.hasText(dto.getOperatorNo()) ? dto.getOperatorNo() : operatorOrDefault(operator));
        ledger.setOperatorName(StringUtils.hasText(dto.getOperatorName()) ? dto.getOperatorName() : operatorOrDefault(operator));
        ledger.setRemovedBy(ledger.getOperatorNo());
        ledger.setRemark(StringUtils.hasText(dto.getRemark()) ? dto.getRemark() : "领用物品");
        boolean success = itemLedgerService.saveLedger(ledger);
        if (success) {
            operationLogService.record(slot.getCabinetId(), operatorOrDefault(operator), "ITEM_RECEIVE",
                    "领用物品：" + item.getName() + "，数量：" + quantity, request.getRemoteAddr());
        }
        return Result.success(itemStockService.getStockByItemId(item.getId()));
    }

    @PostMapping("/save")
    public Result<Boolean> save(@RequestBody ItemSaveDTO dto,
                                @RequestHeader(value = "X-Operator", required = false) String operator,
                                HttpServletRequest request) {
        Item item = toItem(dto);
        item.setStandardWeight(WeightUnitUtil.zeroIfNullIntegerGram(item.getStandardWeight(), "标准重量"));
        normalizeStockConfig(item);
        boolean success = item.getId() == null
                ? itemMapper.insert(item) > 0
                : itemMapper.updateById(item) > 0;
        if (success) {
            itemStockService.updateStockConfig(item.getId(), item.getWarningQuantity(), item.getMaxQuantity());
        }
        if (success) {
            operationLogService.record(null, operatorOrDefault(operator), "ITEM_SAVE", "保存物品：" + item.getName(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/stock/save")
    public Result<Boolean> saveStock(@RequestBody ItemStock stock,
                                     @RequestHeader(value = "X-Operator", required = false) String operator,
                                     HttpServletRequest request) {
        boolean success = itemStockService.adjustStock(stock);
        if (success) {
            operationLogService.record(stock.getCabinetId(), operatorOrDefault(operator), "STOCK_SAVE", "修正库存，物品：" + stock.getItemId(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {
        excelUtil.exportItem(response);
    }

    @GetMapping("/import-template")
    public void importTemplate(HttpServletResponse response) throws IOException {
        excelUtil.exportItemImportTemplate(response);
    }

    @PostMapping("/import")
    public Result<String> importItem(@RequestParam("file") MultipartFile file,
                                     @RequestHeader(value = "X-Operator", required = false) String operator,
                                     HttpServletRequest request) throws IOException {
        excelUtil.importItem(file.getInputStream());
        itemMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Item>())
                .forEach(item -> itemStockService.updateStockConfig(item.getId(), item.getWarningQuantity(), item.getMaxQuantity()));
        operationLogService.record(null, operatorOrDefault(operator), "ITEM_IMPORT", "导入物品基础信息", request.getRemoteAddr());
        return Result.success("导入成功");
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }

    private Item toItem(ItemSaveDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("物品信息不能为空");
        }
        Item item = new Item();
        item.setId(dto.getId());
        item.setName(dto.getName());
        item.setCategory(dto.getCategory());
        item.setSpec(dto.getSpec());
        item.setStandardWeight(dto.getStandardWeight());
        item.setUseType(dto.getUseType());
        item.setWarningQuantity(dto.getWarningQuantity());
        item.setMaxQuantity(dto.getMaxQuantity());
        return item;
    }

    private Item validateReceive(ItemReceiveDTO dto) {
        if (dto == null || dto.getItemId() == null) {
            throw new IllegalArgumentException("物品ID不能为空");
        }
        if (dto.getQuantity() == null || dto.getQuantity() <= 0) {
            throw new IllegalArgumentException("领用数量必须大于0");
        }
        Item item = itemMapper.selectById(dto.getItemId());
        if (item == null) {
            throw new IllegalArgumentException("物品不存在");
        }
        if (item.getUseType() != null && item.getUseType() == 1) {
            throw new IllegalArgumentException("该物品仅支持借用，不能领用");
        }
        return item;
    }

    private void normalizeStockConfig(Item item) {
        if (item.getWarningQuantity() == null) {
            item.setWarningQuantity(0);
        }
        if (item.getMaxQuantity() == null) {
            item.setMaxQuantity(0);
        }
        if (item.getUseType() == null) {
            item.setUseType(0);
        }
        if (item.getWarningQuantity() < 0) {
            throw new IllegalArgumentException("预警数量不能为负数");
        }
        if (item.getMaxQuantity() < 0) {
            throw new IllegalArgumentException("最大库存不能为负数");
        }
        if (item.getUseType() < 0 || item.getUseType() > 2) {
            throw new IllegalArgumentException("使用类型不正确");
        }
    }
}
