package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.dto.WeightReportDTO;
import com.cabinet.entity.WeightRecord;
import com.cabinet.excel.ExcelUtil;
import com.cabinet.service.WeightRecordService;
import com.cabinet.vo.WeightReportVO;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/cabinet/weight")
public class WeightRecordController {

    private final WeightRecordService weightRecordService;
    private final ExcelUtil excelUtil;

    public WeightRecordController(WeightRecordService weightRecordService, ExcelUtil excelUtil) {
        this.weightRecordService = weightRecordService;
        this.excelUtil = excelUtil;
    }

    @PostMapping("/report")
    public Result<WeightReportVO> report(@RequestBody WeightReportDTO dto) {
        return Result.success(weightRecordService.reportWeight(dto));
    }

    @GetMapping("/list")
    public Result<List<WeightRecord>> list(@RequestParam String cabinetId) {
        List<WeightRecord> list = weightRecordService.lambdaQuery()
                .eq(WeightRecord::getCabinetId, cabinetId)
                .orderByDesc(WeightRecord::getRecordedAt)
                .list();
        return Result.success(list);
    }

    // ==================== 导出 ====================

    @GetMapping("/export")
    public void export(@RequestParam String cabinetId, HttpServletResponse response) throws IOException {
        excelUtil.exportWeightRecord(cabinetId, response);
    }
}
