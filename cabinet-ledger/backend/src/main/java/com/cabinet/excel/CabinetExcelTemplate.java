package com.cabinet.excel;

import com.alibaba.excel.annotation.ExcelProperty;

/**
 * 柜子 Excel 导入/导出模板
 */
public class CabinetExcelTemplate {

    @ExcelProperty("柜号")
    private Integer cabinetNo;

    @ExcelProperty("柜子ID")
    private String id;

    @ExcelProperty("名称")
    private String name;

    @ExcelProperty("位置")
    private String location;

    @ExcelProperty("状态")
    private String statusText;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Integer getCabinetNo() { return cabinetNo; }
    public void setCabinetNo(Integer cabinetNo) { this.cabinetNo = cabinetNo; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }
}
