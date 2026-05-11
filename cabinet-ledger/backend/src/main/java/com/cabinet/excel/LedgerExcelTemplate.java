package com.cabinet.excel;

import com.alibaba.excel.annotation.ExcelProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 物品台账 Excel 导出模板
 */
public class LedgerExcelTemplate {

    @ExcelProperty("物品名称")
    private String itemName;

    @ExcelProperty("类别")
    private String category;

    @ExcelProperty("规格")
    private String spec;

    @ExcelProperty("柜号")
    private String cabinetId;

    @ExcelProperty("格口号")
    private Integer slotNo;

    @ExcelProperty("数量")
    private Integer quantity;

    @ExcelProperty("总重量(g)")
    private BigDecimal totalWeight;

    @ExcelProperty("操作类型")
    private String operationTypeText;

    @ExcelProperty("状态")
    private String statusText;

    @ExcelProperty("存放人")
    private String storedBy;

    @ExcelProperty("存放时间")
    private LocalDateTime storedAt;

    @ExcelProperty("备注")
    private String remark;

    // 手写 getter/setter
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }

    public String getCabinetId() { return cabinetId; }
    public void setCabinetId(String cabinetId) { this.cabinetId = cabinetId; }

    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getTotalWeight() { return totalWeight; }
    public void setTotalWeight(BigDecimal totalWeight) { this.totalWeight = totalWeight; }

    public String getOperationTypeText() { return operationTypeText; }
    public void setOperationTypeText(String operationTypeText) { this.operationTypeText = operationTypeText; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public String getStoredBy() { return storedBy; }
    public void setStoredBy(String storedBy) { this.storedBy = storedBy; }

    public LocalDateTime getStoredAt() { return storedAt; }
    public void setStoredAt(LocalDateTime storedAt) { this.storedAt = storedAt; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
