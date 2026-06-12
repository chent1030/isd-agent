package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.dto.CabinetItemOperateDTO;
import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReceiveDTO;
import com.cabinet.dto.ItemSaveDTO;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemStock;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.service.CabinetItemOperationService;
import com.cabinet.service.ItemStockService;
import com.cabinet.service.OperationLogService;
import com.cabinet.util.WeightUnitUtil;
import com.cabinet.vo.AvailableItemVO;
import com.cabinet.vo.CabinetOperationVO;
import com.cabinet.vo.ItemStockReminderVO;
import com.cabinet.vo.ItemStockVO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/cabinet/item")
public class ItemController {
    private final ItemMapper itemMapper;
    private final ItemStockService itemStockService;
    private final CabinetItemOperationService cabinetItemOperationService;
    private final OperationLogService operationLogService;
    private final ExcelUtil excelUtil;

    public ItemController(ItemMapper itemMapper,
                          ItemStockService itemStockService,
                          CabinetItemOperationService cabinetItemOperationService,
                          OperationLogService operationLogService,
                          ExcelUtil excelUtil) {
        this.itemMapper = itemMapper;
        this.itemStockService = itemStockService;
        this.cabinetItemOperationService = cabinetItemOperationService;
        this.operationLogService = operationLogService;
        this.excelUtil = excelUtil;
    }

    @GetMapping("/list")
    public Result<List<ItemStockVO>> list() {
        return Result.success(itemMapper.selectItemStockList());
    }

    @GetMapping("/reminders/stock")
    public Result<List<ItemStockReminderVO>> stockReminders() {
        return Result.success(itemMapper.selectStockReminders());
    }

    @GetMapping("/available")
    public Result<List<AvailableItemVO>> available(@RequestHeader(value = "X-Operator", required = false) String operator) {
        return Result.success(itemMapper.selectAvailableItems(operator));
    }

    @PostMapping("/operate/plan")
    public Result<CabinetOperationVO> planOperation(@RequestBody CabinetItemOperateDTO dto,
                                                   @RequestHeader(value = "X-Operator", required = false) String operator) {
        return Result.success(cabinetItemOperationService.plan(dto, operatorOrDefault(operator)));
    }

    @PostMapping("/receive")
    public Result<CabinetOperationVO> receive(@RequestBody ItemReceiveDTO dto,
                                             @RequestHeader(value = "X-Operator", required = false) String operator,
                                             HttpServletRequest request) {
        CabinetOperationVO vo = cabinetItemOperationService.receive(dto, operatorOrDefault(operator));
        operationLogService.record(null, operatorOrDefault(operator), "ITEM_RECEIVE",
                "领取物品：" + (vo == null ? dto.getItemId() : vo.getItemName()) + "，数量：" + dto.getQuantity(),
                request.getRemoteAddr());
        return Result.success(vo);
    }

    @PostMapping("/operate/borrow")
    public Result<CabinetOperationVO> borrow(@RequestBody ItemBorrowDTO dto,
                                            @RequestHeader(value = "X-Operator", required = false) String operator,
                                            HttpServletRequest request) {
        CabinetOperationVO vo = cabinetItemOperationService.borrow(dto, operatorOrDefault(operator));
        operationLogService.record(null, operatorOrDefault(operator), "ITEM_BORROW",
                "借用物品：" + (vo == null ? dto.getItemId() : vo.getItemName()) + "，数量：" + dto.getQuantity(),
                request.getRemoteAddr());
        return Result.success(vo);
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
            operationLogService.record(null, operatorOrDefault(operator), "ITEM_SAVE",
                    "保存物品：" + item.getName(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/stock/save")
    public Result<Boolean> saveStock(@RequestBody ItemStock stock,
                                     @RequestHeader(value = "X-Operator", required = false) String operator,
                                     HttpServletRequest request) {
        boolean success = itemStockService.adjustStock(stock);
        if (success) {
            operationLogService.record(stock.getCabinetId(), operatorOrDefault(operator), "STOCK_SAVE",
                    "修正库存，物品：" + stock.getItemId(), request.getRemoteAddr());
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
        itemMapper.selectAll()
                .forEach(item -> itemStockService.updateStockConfig(item.getId(), item.getWarningQuantity(), item.getMaxQuantity()));
        operationLogService.record(null, operatorOrDefault(operator), "ITEM_IMPORT",
                "导入物品基础信息", request.getRemoteAddr());
        return Result.success("导入成功");
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
        item.setAuthRequired(dto.getAuthRequired());
        item.setBorrowerReminderHours(dto.getBorrowerReminderHours());
        item.setAdminReminderHours(dto.getAdminReminderHours());
        return item;
    }

    private void normalizeStockConfig(Item item) {
        if (!StringUtils.hasText(item.getName())) {
            throw new IllegalArgumentException("物品名称不能为空");
        }
        if (item.getWarningQuantity() == null) {
            item.setWarningQuantity(0);
        }
        if (item.getMaxQuantity() == null) {
            item.setMaxQuantity(0);
        }
        if (item.getUseType() == null) {
            item.setUseType(0);
        }
        if (item.getAuthRequired() == null) {
            item.setAuthRequired(0);
        }
        if (item.getBorrowerReminderHours() == null) {
            item.setBorrowerReminderHours(24);
        }
        if (item.getAdminReminderHours() == null) {
            item.setAdminReminderHours(48);
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
        if (item.getAuthRequired() < 0 || item.getAuthRequired() > 1) {
            throw new IllegalArgumentException("授权开关不正确");
        }
        if (item.getBorrowerReminderHours() < 0) {
            throw new IllegalArgumentException("借用人提醒周期不能为负数");
        }
        if (item.getAdminReminderHours() < 0) {
            throw new IllegalArgumentException("管理员提醒周期不能为负数");
        }
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }
}
