package com.cabinet.excel;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.cabinet.entity.Item;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.util.WeightUnitUtil;
import java.time.LocalDateTime;
import org.springframework.util.StringUtils;

public class ItemImportListener implements ReadListener<ItemExcelTemplate> {
    private final ItemMapper itemMapper;

    public ItemImportListener(ItemMapper itemMapper) {
        this.itemMapper = itemMapper;
    }

    @Override
    public void invoke(ItemExcelTemplate row, AnalysisContext context) {
        if (row == null || !StringUtils.hasText(row.getName())) {
            return;
        }

        Item item = itemMapper.selectByUniqueFields(row.getName(), row.getCategory(), row.getSpec());
        if (item == null) {
            item = new Item();
            item.setName(row.getName());
            item.setCategory(row.getCategory());
            item.setSpec(row.getSpec());
            item.setStandardWeight(WeightUnitUtil.zeroIfNullIntegerGram(row.getStandardWeight(), "标准重量"));
            item.setUseType(parseUseType(row.getUseTypeText()));
            item.setWarningQuantity(nonNegative(row.getWarningQuantity(), "预警数量"));
            item.setMaxQuantity(nonNegative(row.getMaxQuantity(), "最大库存"));
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
            itemMapper.insert(item);
        } else {
            item.setCategory(row.getCategory());
            item.setSpec(row.getSpec());
            item.setStandardWeight(WeightUnitUtil.zeroIfNullIntegerGram(row.getStandardWeight(), "标准重量"));
            item.setUseType(parseUseType(row.getUseTypeText()));
            item.setWarningQuantity(nonNegative(row.getWarningQuantity(), "预警数量"));
            item.setMaxQuantity(nonNegative(row.getMaxQuantity(), "最大库存"));
            item.setUpdatedAt(LocalDateTime.now());
            itemMapper.updateById(item);
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
    }

    private Integer nonNegative(Integer value, String fieldName) {
        if (value == null) {
            return 0;
        }
        if (value < 0) {
            throw new IllegalArgumentException(fieldName + "不能为负数");
        }
        return value;
    }

    private Integer parseUseType(String text) {
        if (!StringUtils.hasText(text) || "领用".equals(text)) {
            return 0;
        }
        if ("借用".equals(text)) {
            return 1;
        }
        if ("领用/借用".equals(text) || "借用/领用".equals(text)) {
            return 2;
        }
        throw new IllegalArgumentException("使用类型只能为领用、借用、领用/借用");
    }
}
