package com.cabinet.service.impl;

import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReturnDTO;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemBorrowRecord;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.ItemStock;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.mapper.ItemBorrowRecordMapper;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.mapper.ItemStockMapper;
import com.cabinet.service.ItemBorrowRecordService;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.service.ItemStockService;
import com.cabinet.util.WeightUnitUtil;
import com.cabinet.vo.ItemBorrowRecordVO;
import io.choerodon.core.domain.Page;
import io.choerodon.mybatis.pagehelper.PageHelper;
import io.choerodon.mybatis.pagehelper.domain.PageRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ItemBorrowRecordServiceImpl implements ItemBorrowRecordService {
    private final ItemBorrowRecordMapper borrowRecordMapper;
    private final ItemMapper itemMapper;
    private final CabinetSlotMapper cabinetSlotMapper;
    private final ItemStockMapper itemStockMapper;
    private final ItemStockService itemStockService;
    private final ItemLedgerService itemLedgerService;

    public ItemBorrowRecordServiceImpl(ItemBorrowRecordMapper borrowRecordMapper,
                                       ItemMapper itemMapper,
                                       CabinetSlotMapper cabinetSlotMapper,
                                       ItemStockMapper itemStockMapper,
                                       ItemStockService itemStockService,
                                       ItemLedgerService itemLedgerService) {
        this.borrowRecordMapper = borrowRecordMapper;
        this.itemMapper = itemMapper;
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.itemStockMapper = itemStockMapper;
        this.itemStockService = itemStockService;
        this.itemLedgerService = itemLedgerService;
    }

    @Override
    @Transactional
    public ItemBorrowRecordVO borrow(ItemBorrowDTO dto, String operator) {
        if (dto == null || dto.getItemId() == null) {
            throw new IllegalArgumentException("物品ID不能为空");
        }
        int quantity = requirePositiveQuantity(dto.getQuantity());
        if (!StringUtils.hasText(dto.getBorrower())) {
            throw new IllegalArgumentException("借用人不能为空");
        }

        Item item = itemMapper.selectById(dto.getItemId());
        if (item == null) {
            throw new IllegalArgumentException("物品不存在");
        }
        if (item.getUseType() != null && item.getUseType() == 0) {
            throw new IllegalArgumentException("该物品仅支持领用，不能借用");
        }

        CabinetSlot slot = cabinetSlotMapper.selectByItemId(dto.getItemId());
        if (slot == null) {
            throw new IllegalArgumentException("物品未绑定柜子格口");
        }

        ItemStock stock = itemStockMapper.selectByItemId(dto.getItemId());
        int available = stock == null || stock.getQuantity() == null ? 0 : stock.getQuantity();
        if (available < quantity) {
            throw new IllegalArgumentException("可借库存不足");
        }

        LocalDateTime now = LocalDateTime.now();
        ItemBorrowRecord record = new ItemBorrowRecord();
        record.setItemId(dto.getItemId());
        record.setCabinetId(slot.getCabinetId());
        record.setSlotId(slot.getId());
        record.setQuantity(quantity);
        record.setReturnedQuantity(0);
        record.setBorrower(dto.getBorrower());
        record.setBorrowOperator(operator);
        record.setBorrowOperatorNo(resolveOperatorNo(dto.getOperatorNo(), operator));
        record.setBorrowOperatorName(resolveOperatorName(dto.getOperatorName(), operator));
        record.setBorrowTime(now);
        record.setExpectedReturnTime(dto.getExpectedReturnTime());
        record.setStatus(0);
        record.setRemark(dto.getRemark());
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        borrowRecordMapper.insert(record);

        itemStockService.applyLedger(createLedger(item, slot, quantity, 2, 1, operator, dto.getOperatorNo(), dto.getOperatorName(), now, "借用记录：" + record.getId()));
        return getRecord(record.getId());
    }

    @Override
    @Transactional
    public ItemBorrowRecordVO returnItem(ItemReturnDTO dto, String operator) {
        if (dto == null || dto.getBorrowRecordId() == null) {
            throw new IllegalArgumentException("借用记录ID不能为空");
        }
        int quantity = requirePositiveQuantity(dto.getQuantity());
        ItemBorrowRecord record = borrowRecordMapper.selectById(dto.getBorrowRecordId());
        if (record == null) {
            throw new IllegalArgumentException("借用记录不存在");
        }
        int borrowed = record.getQuantity() == null ? 0 : record.getQuantity();
        int returned = record.getReturnedQuantity() == null ? 0 : record.getReturnedQuantity();
        int pending = borrowed - returned;
        if (pending <= 0) {
            throw new IllegalArgumentException("该借用记录已全部归还");
        }
        if (quantity > pending) {
            throw new IllegalArgumentException("归还数量不能大于未归还数量");
        }

        LocalDateTime now = LocalDateTime.now();
        record.setReturnedQuantity(returned + quantity);
        record.setReturnOperator(operator);
        record.setReturnOperatorNo(resolveOperatorNo(dto.getOperatorNo(), operator));
        record.setReturnOperatorName(resolveOperatorName(dto.getOperatorName(), operator));
        record.setReturnTime(record.getReturnedQuantity().equals(record.getQuantity()) ? now : record.getReturnTime());
        record.setStatus(record.getReturnedQuantity().equals(record.getQuantity()) ? 1 : 2);
        record.setUpdatedAt(now);
        if (StringUtils.hasText(dto.getRemark())) {
            record.setRemark(dto.getRemark());
        }
        borrowRecordMapper.updateById(record);

        Item item = itemMapper.selectById(record.getItemId());
        CabinetSlot slot = cabinetSlotMapper.selectById(record.getSlotId());
        itemStockService.applyLedger(createLedger(item, slot, quantity, 3, 0, operator, dto.getOperatorNo(), dto.getOperatorName(), now, "归还借用记录：" + record.getId()));
        return getRecord(record.getId());
    }

    @Override
    public Page<ItemBorrowRecordVO> getBorrowRecordList(Integer status, Long itemId, String borrower, int page, int size) {
        int current = page <= 0 ? 1 : page;
        int pageSize = size <= 0 ? 20 : size;
        return PageHelper.doPage(new PageRequest(current - 1, pageSize),
                () -> borrowRecordMapper.selectBorrowRecordList(status, itemId, borrower));
    }

    private ItemBorrowRecordVO getRecord(Long id) {
        return borrowRecordMapper.selectBorrowRecordById(id);
    }

    private ItemLedger createLedger(Item item, CabinetSlot slot, int quantity, int operationType, int status, String operator, String operatorNo, String operatorName, LocalDateTime now, String remark) {
        if (slot == null) {
            throw new IllegalArgumentException("格口不存在");
        }
        ItemLedger ledger = new ItemLedger();
        ledger.setItemId(item == null ? null : item.getId());
        ledger.setCabinetId(slot.getCabinetId());
        ledger.setSlotId(slot.getId());
        ledger.setQuantity(quantity);
        BigDecimal standardWeight = item == null || item.getStandardWeight() == null ? BigDecimal.ZERO : item.getStandardWeight();
        ledger.setTotalWeight(WeightUnitUtil.zeroIfNullIntegerGram(standardWeight.multiply(BigDecimal.valueOf(quantity)), "总重量"));
        ledger.setOperationType(operationType);
        ledger.setStatus(status);
        ledger.setOperatorNo(resolveOperatorNo(operatorNo, operator));
        ledger.setOperatorName(resolveOperatorName(operatorName, operator));
        ledger.setRemark(remark);
        if (status == 0) {
            ledger.setStoredBy(operator);
            ledger.setStoredAt(now);
        } else {
            ledger.setRemovedBy(operator);
            ledger.setRemovedAt(now);
        }
        return ledger;
    }

    private String resolveOperatorNo(String operatorNo, String fallback) {
        return StringUtils.hasText(operatorNo) ? operatorNo : fallback;
    }

    private String resolveOperatorName(String operatorName, String fallback) {
        return StringUtils.hasText(operatorName) ? operatorName : fallback;
    }

    private int requirePositiveQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("数量必须大于0");
        }
        return quantity;
    }
}
