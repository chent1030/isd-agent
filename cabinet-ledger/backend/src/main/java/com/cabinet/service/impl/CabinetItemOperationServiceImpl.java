package com.cabinet.service.impl;

import com.cabinet.dto.CabinetItemOperateDTO;
import com.cabinet.dto.CabinetOperationLocationDTO;
import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReceiveDTO;
import com.cabinet.entity.Cabinet;
import com.cabinet.entity.CabinetSlot;
import com.cabinet.entity.Item;
import com.cabinet.entity.ItemBorrowRecord;
import com.cabinet.entity.ItemLedger;
import com.cabinet.entity.ItemStock;
import com.cabinet.mapper.CabinetSlotMapper;
import com.cabinet.mapper.ItemAuthorizationMapper;
import com.cabinet.mapper.ItemBorrowRecordMapper;
import com.cabinet.mapper.ItemLedgerMapper;
import com.cabinet.mapper.ItemMapper;
import com.cabinet.mapper.ItemStockMapper;
import com.cabinet.service.CabinetAllocationPolicy;
import com.cabinet.service.CabinetItemOperationService;
import com.cabinet.service.CabinetService;
import com.cabinet.util.WeightUnitUtil;
import com.cabinet.vo.CabinetOperationVO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CabinetItemOperationServiceImpl implements CabinetItemOperationService {

    private final ItemMapper itemMapper;
    private final ItemStockMapper itemStockMapper;
    private final CabinetSlotMapper cabinetSlotMapper;
    private final ItemAuthorizationMapper authorizationMapper;
    private final ItemBorrowRecordMapper borrowRecordMapper;
    private final ItemLedgerMapper itemLedgerMapper;
    private final CabinetService cabinetService;
    private final CabinetAllocationPolicy allocationPolicy = new CabinetAllocationPolicy();

    public CabinetItemOperationServiceImpl(ItemMapper itemMapper,
                                           ItemStockMapper itemStockMapper,
                                           CabinetSlotMapper cabinetSlotMapper,
                                           ItemAuthorizationMapper authorizationMapper,
                                           ItemBorrowRecordMapper borrowRecordMapper,
                                           ItemLedgerMapper itemLedgerMapper,
                                           CabinetService cabinetService) {
        this.itemMapper = itemMapper;
        this.itemStockMapper = itemStockMapper;
        this.cabinetSlotMapper = cabinetSlotMapper;
        this.authorizationMapper = authorizationMapper;
        this.borrowRecordMapper = borrowRecordMapper;
        this.itemLedgerMapper = itemLedgerMapper;
        this.cabinetService = cabinetService;
    }

    @Override
    public CabinetOperationVO plan(CabinetItemOperateDTO dto, String operator) {
        OperationContext context = buildContext(dto.getItemId(), dto.getQuantity(), dto.getAction(), dto.getOperatorNo(), operator);
        return toOperationVO(context, allocate(context.item(), context.quantity()), context.action(), null);
    }

    @Override
    @Transactional
    public CabinetOperationVO receive(ItemReceiveDTO dto, String operator) {
        OperationContext context = buildContext(dto.getItemId(), dto.getQuantity(), "receive", dto.getOperatorNo(), operator);
        List<CabinetAllocationPolicy.SlotAllocation> allocations = resolveAllocations(context, dto.getLocations());
        applyDecrease(context, allocations, 1, 1, dto.getOperatorNo(), dto.getOperatorName(), dto.getRemark(), operator);
        ItemStock stock = itemStockMapper.selectByItemId(context.item().getId());
        return toOperationVO(context, allocations, "receive", stock == null ? 0 : stock.getQuantity());
    }

    @Override
    @Transactional
    public CabinetOperationVO borrow(ItemBorrowDTO dto, String operator) {
        OperationContext context = buildContext(dto.getItemId(), dto.getQuantity(), "borrow", dto.getOperatorNo(), operator);
        if (!StringUtils.hasText(dto.getBorrower())) {
            throw new IllegalArgumentException("借用人不能为空");
        }
        List<CabinetAllocationPolicy.SlotAllocation> allocations = resolveAllocations(context, dto.getLocations());
        applyDecrease(context, allocations, 2, 1, dto.getOperatorNo(), dto.getOperatorName(), dto.getRemark(), operator);
        createBorrowRecords(context, allocations, dto, operator);
        ItemStock stock = itemStockMapper.selectByItemId(context.item().getId());
        return toOperationVO(context, allocations, "borrow", stock == null ? 0 : stock.getQuantity());
    }

    private OperationContext buildContext(Long itemId, Integer rawQuantity, String action, String operatorNo, String fallbackOperator) {
        if (itemId == null) {
            throw new IllegalArgumentException("物品ID不能为空");
        }
        int quantity = requirePositiveQuantity(rawQuantity);
        String normalizedAction = normalizeAction(action);
        Item item = itemMapper.selectById(itemId);
        if (item == null) {
            throw new IllegalArgumentException("物品不存在");
        }
        validateUseType(item, normalizedAction);
        validateAuthorization(item, resolveOperatorNo(operatorNo, fallbackOperator));
        ItemStock stock = itemStockMapper.selectByItemId(itemId);
        int itemStock = stock == null || stock.getQuantity() == null ? 0 : stock.getQuantity();
        if (itemStock < quantity) {
            throw new IllegalArgumentException("物品库存不足，当前库存：" + itemStock);
        }
        return new OperationContext(item, quantity, normalizedAction);
    }

    private List<CabinetAllocationPolicy.SlotAllocation> resolveAllocations(OperationContext context,
                                                                            List<CabinetOperationLocationDTO> requestedLocations) {
        List<CabinetAllocationPolicy.SlotAllocation> allocations = requestedLocations == null || requestedLocations.isEmpty()
                ? allocate(context.item(), context.quantity())
                : normalizeRequestedLocations(context.item(), requestedLocations);
        int total = allocations.stream().mapToInt(CabinetAllocationPolicy.SlotAllocation::quantity).sum();
        if (total != context.quantity()) {
            throw new IllegalArgumentException("格口分配数量与申请数量不一致");
        }
        return allocations;
    }

    private List<CabinetAllocationPolicy.SlotAllocation> allocate(Item item, int quantity) {
        List<CabinetAllocationPolicy.AllocatableSlot> slots = new ArrayList<>();
        for (CabinetSlot slot : cabinetSlotMapper.selectByItemIdForAllocation(item.getId())) {
            Cabinet cabinet = cabinetService.getById(slot.getCabinetId());
            slots.add(new CabinetAllocationPolicy.AllocatableSlot(
                    slot.getId(),
                    slot.getCabinetId(),
                    cabinet == null ? null : cabinet.getCabinetNo(),
                    slot.getSlotNo(),
                    slot.getItemQuantity() == null ? 0 : slot.getItemQuantity()
            ));
        }
        try {
            return allocationPolicy.allocate(slots, quantity);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("柜内可领数量不足");
        }
    }

    private List<CabinetAllocationPolicy.SlotAllocation> normalizeRequestedLocations(Item item,
                                                                                    List<CabinetOperationLocationDTO> requestedLocations) {
        List<CabinetAllocationPolicy.SlotAllocation> allocations = new ArrayList<>();
        for (CabinetOperationLocationDTO requested : requestedLocations) {
            CabinetSlot slot = findSlot(requested);
            if (slot == null || slot.getItemId() == null || !slot.getItemId().equals(item.getId())) {
                throw new IllegalArgumentException("格口未绑定当前物品");
            }
            int quantity = requirePositiveQuantity(requested.getQuantity());
            int slotQuantity = slot.getItemQuantity() == null ? 0 : slot.getItemQuantity();
            if (slotQuantity < quantity) {
                throw new IllegalArgumentException("格口库存不足：" + slot.getSlotNo());
            }
            Cabinet cabinet = cabinetService.getById(slot.getCabinetId());
            allocations.add(new CabinetAllocationPolicy.SlotAllocation(
                    slot.getId(),
                    slot.getCabinetId(),
                    cabinet == null ? null : cabinet.getCabinetNo(),
                    slot.getSlotNo(),
                    quantity
            ));
        }
        return allocations;
    }

    private CabinetSlot findSlot(CabinetOperationLocationDTO requested) {
        if (requested == null) {
            return null;
        }
        if (requested.getSlotId() != null) {
            return cabinetSlotMapper.selectById(requested.getSlotId());
        }
        if (requested.getCabinetId() != null && requested.getSlotNo() != null) {
            return cabinetSlotMapper.selectByCabinetIdAndSlotNo(requested.getCabinetId(), requested.getSlotNo());
        }
        if (requested.getCabinetNo() != null && requested.getSlotNo() != null) {
            Cabinet cabinet = cabinetService.getByCabinetNo(requested.getCabinetNo());
            return cabinet == null ? null : cabinetSlotMapper.selectByCabinetIdAndSlotNo(cabinet.getId(), requested.getSlotNo());
        }
        return null;
    }

    private void applyDecrease(OperationContext context,
                               List<CabinetAllocationPolicy.SlotAllocation> allocations,
                               int operationType,
                               int status,
                               String operatorNo,
                               String operatorName,
                               String remark,
                               String fallbackOperator) {
        if (itemMapper.decreaseStock(context.item().getId(), context.quantity()) <= 0) {
            throw new IllegalArgumentException("物品库存不足");
        }
        LocalDateTime now = LocalDateTime.now();
        for (CabinetAllocationPolicy.SlotAllocation allocation : allocations) {
            if (cabinetSlotMapper.decreaseItemQuantity(allocation.slotId(), allocation.quantity()) <= 0) {
                throw new IllegalArgumentException("格口库存不足：" + allocation.slotNo());
            }
            insertLedger(context.item(), allocation, operationType, status, operatorNo, operatorName, remark, fallbackOperator, now);
        }
    }

    private void createBorrowRecords(OperationContext context,
                                     List<CabinetAllocationPolicy.SlotAllocation> allocations,
                                     ItemBorrowDTO dto,
                                     String fallbackOperator) {
        LocalDateTime now = LocalDateTime.now();
        for (CabinetAllocationPolicy.SlotAllocation allocation : allocations) {
            ItemBorrowRecord record = new ItemBorrowRecord();
            record.setItemId(context.item().getId());
            record.setCabinetId(allocation.cabinetId());
            record.setSlotId(allocation.slotId());
            record.setQuantity(allocation.quantity());
            record.setReturnedQuantity(0);
            record.setBorrower(dto.getBorrower());
            record.setBorrowOperator(fallbackOperator);
            record.setBorrowOperatorNo(resolveOperatorNo(dto.getOperatorNo(), fallbackOperator));
            record.setBorrowOperatorName(resolveOperatorName(dto.getOperatorName(), fallbackOperator));
            record.setBorrowTime(now);
            record.setExpectedReturnTime(dto.getExpectedReturnTime());
            record.setStatus(0);
            record.setRemark(dto.getRemark());
            record.setCreatedAt(now);
            record.setUpdatedAt(now);
            borrowRecordMapper.insert(record);
        }
    }

    private void insertLedger(Item item,
                              CabinetAllocationPolicy.SlotAllocation allocation,
                              int operationType,
                              int status,
                              String operatorNo,
                              String operatorName,
                              String remark,
                              String fallbackOperator,
                              LocalDateTime now) {
        ItemLedger ledger = new ItemLedger();
        ledger.setItemId(item.getId());
        ledger.setCabinetId(allocation.cabinetId());
        ledger.setSlotId(allocation.slotId());
        ledger.setQuantity(allocation.quantity());
        BigDecimal standardWeight = item.getStandardWeight() == null ? BigDecimal.ZERO : item.getStandardWeight();
        ledger.setTotalWeight(WeightUnitUtil.zeroIfNullIntegerGram(standardWeight.multiply(BigDecimal.valueOf(allocation.quantity())), "总重量"));
        ledger.setOperationType(operationType);
        ledger.setStatus(status);
        ledger.setOperatorNo(resolveOperatorNo(operatorNo, fallbackOperator));
        ledger.setOperatorName(resolveOperatorName(operatorName, fallbackOperator));
        ledger.setRemovedBy(ledger.getOperatorNo());
        ledger.setRemovedAt(now);
        ledger.setRemark(remark);
        ledger.setCreatedAt(now);
        ledger.setUpdatedAt(now);
        itemLedgerMapper.insert(ledger);
    }

    private CabinetOperationVO toOperationVO(OperationContext context,
                                             List<CabinetAllocationPolicy.SlotAllocation> allocations,
                                             String action,
                                             Integer remainingStock) {
        CabinetOperationVO vo = new CabinetOperationVO();
        vo.setItemId(context.item().getId());
        vo.setItemName(context.item().getName());
        vo.setAction(action);
        vo.setQuantity(context.quantity());
        vo.setRemainingStock(remainingStock);
        List<CabinetOperationVO.Location> locations = new ArrayList<>();
        for (CabinetAllocationPolicy.SlotAllocation allocation : allocations) {
            Cabinet cabinet = cabinetService.getById(allocation.cabinetId());
            CabinetSlot slot = cabinetSlotMapper.selectById(allocation.slotId());
            CabinetOperationVO.Location location = new CabinetOperationVO.Location();
            location.setSlotId(allocation.slotId());
            location.setCabinetId(allocation.cabinetId());
            location.setCabinetNo(allocation.cabinetNo());
            location.setCabinetName(cabinet == null ? null : cabinet.getName());
            location.setSlotNo(allocation.slotNo());
            location.setQuantity(allocation.quantity());
            location.setRemainingSlotQuantity(slot == null ? null : slot.getItemQuantity());
            locations.add(location);
        }
        vo.setLocations(locations);
        return vo;
    }

    private void validateUseType(Item item, String action) {
        if ("receive".equals(action) && item.getUseType() != null && item.getUseType() == 1) {
            throw new IllegalArgumentException("该物品仅支持借用，不能领用");
        }
        if ("borrow".equals(action) && item.getUseType() != null && item.getUseType() == 0) {
            throw new IllegalArgumentException("该物品仅支持领用，不能借用");
        }
    }

    private void validateAuthorization(Item item, String operatorNo) {
        if (item.getAuthRequired() == null || item.getAuthRequired() != 1) {
            return;
        }
        if (!StringUtils.hasText(operatorNo) || authorizationMapper.countValidAuthorization(item.getId(), operatorNo) <= 0) {
            throw new IllegalArgumentException("当前人员无该物品权限");
        }
    }

    private String normalizeAction(String action) {
        if ("borrow".equals(action)) {
            return "borrow";
        }
        if ("receive".equals(action) || action == null || action.isBlank()) {
            return "receive";
        }
        throw new IllegalArgumentException("不支持的操作类型");
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

    private static class OperationContext {
        private final Item item;
        private final int quantity;
        private final String action;

        private OperationContext(Item item, int quantity, String action) {
            this.item = item;
            this.quantity = quantity;
            this.action = action;
        }

        private Item item() {
            return item;
        }

        private int quantity() {
            return quantity;
        }

        private String action() {
            return action;
        }
    }
}
