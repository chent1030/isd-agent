package com.cabinet.excel;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.cabinet.entity.Cabinet;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.WeightRecord;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.service.CabinetService;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.service.WeightRecordService;
import com.cabinet.vo.LedgerVO;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Excel 导入导出工具类
 */
@Component
public class ExcelUtil {

    private final CabinetService cabinetService;
    private final ItemLedgerService itemLedgerService;
    private final WeightRecordService weightRecordService;
    private final ItemMapper itemMapper;

    public ExcelUtil(CabinetService cabinetService,
                     ItemLedgerService itemLedgerService,
                     WeightRecordService weightRecordService,
                     ItemMapper itemMapper) {
        this.cabinetService = cabinetService;
        this.itemLedgerService = itemLedgerService;
        this.weightRecordService = weightRecordService;
        this.itemMapper = itemMapper;
    }

    // ==================== 导出 ====================

    /**
     * 导出物品台账
     */
    public void exportLedger(String cabinetId, Integer operationType, Integer status, String category,
                             HttpServletResponse response) throws IOException {
        List<LedgerVO> list = itemLedgerService.getLedgerList(cabinetId, operationType, status, category, 1, 100000).getList();

        List<LedgerExcelTemplate> excelList = list.stream().map(vo -> {
            LedgerExcelTemplate t = new LedgerExcelTemplate();
            t.setItemName(vo.getItemName());
            t.setCategory(vo.getCategory());
            t.setSpec(vo.getSpec());
            t.setSlotNo(vo.getSlotNo());
            t.setQuantity(vo.getQuantity());
            t.setTotalWeight(vo.getTotalWeight());
            t.setOperationTypeText(convertOperationTypeText(vo.getOperationType()));
            t.setStatusText(convertStatusText(vo.getStatus()));
            t.setStoredBy(vo.getStoredBy());
            t.setStoredAt(vo.getStoredAt());
            return t;
        }).collect(Collectors.toList());

        setResponseHeader(response, "物品台账");
        EasyExcel.write(response.getOutputStream(), LedgerExcelTemplate.class)
                .sheet("物品台账")
                .doWrite(excelList);
    }

    /**
     * 导出柜子列表
     */
    public void exportCabinet(HttpServletResponse response) throws IOException {
        List<Cabinet> list = cabinetService.list();

        List<CabinetExcelTemplate> excelList = list.stream().map(c -> {
            CabinetExcelTemplate t = new CabinetExcelTemplate();
            t.setId(c.getId());
            t.setCabinetNo(c.getCabinetNo());
            t.setName(c.getName());
            t.setLocation(c.getLocation());
            t.setStatusText(c.getStatus() != null && c.getStatus() == 0 ? "正常" : "停用");
            return t;
        }).collect(Collectors.toList());

        setResponseHeader(response, "柜子列表");
        EasyExcel.write(response.getOutputStream(), CabinetExcelTemplate.class)
                .sheet("柜子列表")
                .doWrite(excelList);
    }

    /**
     * 导出称重记录
     */
    public void exportWeightRecord(String cabinetId, HttpServletResponse response) throws IOException {
        List<WeightRecord> list = weightRecordService.lambdaQuery()
                .eq(WeightRecord::getCabinetId, cabinetId)
                .orderByDesc(WeightRecord::getRecordedAt)
                .list();

        List<WeightRecordExcelTemplate> excelList = list.stream().map(r -> {
            WeightRecordExcelTemplate t = new WeightRecordExcelTemplate();
            t.setCabinetId(r.getCabinetId());
            t.setSlotId(r.getSlotId());
            t.setWeight(r.getWeight());
            t.setChangeAmount(r.getChangeAmount());
            t.setEventTypeText(convertEventTypeText(r.getEventType()));
            t.setRecordedAt(r.getRecordedAt());
            return t;
        }).collect(Collectors.toList());

        setResponseHeader(response, "称重记录_" + cabinetId);
        EasyExcel.write(response.getOutputStream(), WeightRecordExcelTemplate.class)
                .sheet("称重记录")
                .doWrite(excelList);
    }

    /**
     * 导出物品基础信息
     */
    public void exportItem(HttpServletResponse response) throws IOException {
        List<Item> list = itemMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Item>()
                        .orderByDesc(Item::getUpdatedAt)
        );
        List<ItemExcelTemplate> excelList = list.stream().map(item -> {
            ItemExcelTemplate t = new ItemExcelTemplate();
            t.setName(item.getName());
            t.setCategory(item.getCategory());
            t.setSpec(item.getSpec());
            t.setStandardWeight(item.getStandardWeight());
            t.setUseTypeText(convertUseTypeText(item.getUseType()));
            t.setWarningQuantity(item.getWarningQuantity());
            t.setMaxQuantity(item.getMaxQuantity());
            return t;
        }).collect(Collectors.toList());

        setResponseHeader(response, "物品基础信息");
        EasyExcel.write(response.getOutputStream(), ItemExcelTemplate.class)
                .sheet("物品基础信息")
                .doWrite(excelList);
    }

    /**
     * 导出物品导入模板
     */
    public void exportItemImportTemplate(HttpServletResponse response) throws IOException {
        ItemExcelTemplate template = new ItemExcelTemplate();
        template.setName("示例物品");
        template.setCategory("工具");
        template.setSpec("规格型号");
        template.setStandardWeight(new java.math.BigDecimal("100"));
        template.setUseTypeText("领用");
        template.setWarningQuantity(1);
        template.setMaxQuantity(10);

        setResponseHeader(response, "物品基础信息导入模板");
        EasyExcel.write(response.getOutputStream(), ItemExcelTemplate.class)
                .sheet("导入模板")
                .doWrite(java.util.List.of(template));
    }

    // ==================== 导入 ====================

    /**
     * 导入物品基础信息
     */
    public void importItem(java.io.InputStream inputStream) {
        ItemImportListener listener = new ItemImportListener(itemMapper);
        EasyExcel.read(inputStream, ItemExcelTemplate.class, listener)
                .sheet()
                .doRead();
    }

    // ==================== 辅助方法 ====================

    private void setResponseHeader(HttpServletResponse response, String fileName) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String encodedFileName = URLEncoder.encode(fileName + "_" + System.currentTimeMillis(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + encodedFileName + ".xlsx");
    }

    private String convertStatusText(Integer status) {
        if (status == null) return "未知";
        switch (status) {
            case 0: return "在库";
            case 1: return "已取出";
            case 2: return "异常";
            default: return "未知";
        }
    }

    private String convertOperationTypeText(Integer operationType) {
        if (operationType == null) return "未知";
        switch (operationType) {
            case 0: return "入库";
            case 1: return "领用";
            case 2: return "借用";
            case 3: return "归还";
            default: return "未知";
        }
    }

    private String convertUseTypeText(Integer useType) {
        if (useType == null) return "领用";
        switch (useType) {
            case 0: return "领用";
            case 1: return "借用";
            case 2: return "领用/借用";
            default: return "领用";
        }
    }

    private String convertEventTypeText(Integer eventType) {
        if (eventType == null) return "未知";
        switch (eventType) {
            case 0: return "定时上报";
            case 1: return "增重";
            case 2: return "减重";
            default: return "未知";
        }
    }
}
