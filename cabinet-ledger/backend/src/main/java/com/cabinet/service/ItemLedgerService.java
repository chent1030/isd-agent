package com.cabinet.service;

import com.cabinet.dto.InventoryCheckDTO;
import com.cabinet.entity.ItemLedger;
import com.cabinet.vo.InventoryCheckVO;
import com.cabinet.vo.LedgerVO;
import io.choerodon.core.domain.Page;

/**
 * 物品台账 Service 接口
 */
public interface ItemLedgerService {

    /**
     * 分页查询台账列表
     *
     * @param cabinetId   智能柜ID
     * @param operationType 操作类型
     * @param status      状态
     * @param category    分类
     * @return 分页结果
     */
    Page<LedgerVO> getLedgerList(String cabinetId, Integer operationType, Integer status, String category, int page, int size);

    /**
     * 盘点库存
     *
     * @param dto 盘点DTO
     * @return 盘点结果
     */
    InventoryCheckVO checkInventory(InventoryCheckDTO dto);

    /**
     * 保存台账
     *
     * @param ledger 台账实体
     * @return 是否成功
     */
    boolean saveLedger(ItemLedger ledger);

    /**
     * 更新台账
     *
     * @param ledger 台账实体
     * @return 是否成功
     */
    boolean updateLedger(ItemLedger ledger);

    void createAutoLedgerFromWeightRecord(com.cabinet.entity.WeightRecord record);
}
