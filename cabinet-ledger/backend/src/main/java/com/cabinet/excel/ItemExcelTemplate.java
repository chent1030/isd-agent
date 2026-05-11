package com.cabinet.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import java.math.BigDecimal;

public class ItemExcelTemplate {
    @ExcelProperty("物品名称")
    private String name;

    @ExcelProperty("类别")
    private String category;

    @ExcelProperty("规格")
    private String spec;

    @ExcelProperty("标准重量(g)")
    private BigDecimal standardWeight;

    @ExcelProperty("使用类型")
    private String useTypeText;

    @ExcelProperty("预警数量")
    private Integer warningQuantity;

    @ExcelProperty("最大库存")
    private Integer maxQuantity;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }
    public BigDecimal getStandardWeight() { return standardWeight; }
    public void setStandardWeight(BigDecimal standardWeight) { this.standardWeight = standardWeight; }
    public String getUseTypeText() { return useTypeText; }
    public void setUseTypeText(String useTypeText) { this.useTypeText = useTypeText; }
    public Integer getWarningQuantity() { return warningQuantity; }
    public void setWarningQuantity(Integer warningQuantity) { this.warningQuantity = warningQuantity; }
    public Integer getMaxQuantity() { return maxQuantity; }
    public void setMaxQuantity(Integer maxQuantity) { this.maxQuantity = maxQuantity; }
}
