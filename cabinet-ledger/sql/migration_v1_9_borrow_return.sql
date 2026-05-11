USE cabinet_ledger;

ALTER TABLE item
    ADD COLUMN use_type TINYINT DEFAULT 0 COMMENT '使用类型：0-领用 1-借用 2-领用/借用' AFTER standard_weight;

ALTER TABLE item_stock
    ADD COLUMN borrowed_quantity INT DEFAULT 0 COMMENT '外借未归还数量' AFTER quantity;

ALTER TABLE item_ledger
    ADD COLUMN operation_type TINYINT DEFAULT 0 COMMENT '操作类型：0-入库 1-领用 2-借用 3-归还' AFTER total_weight;

UPDATE item_ledger
SET operation_type = CASE WHEN status = 1 THEN 1 ELSE 0 END
WHERE deleted = 0 AND operation_type IS NULL;

CREATE TABLE IF NOT EXISTS item_borrow_record (
    id                   BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id              BIGINT NOT NULL COMMENT '关联物品',
    cabinet_id           VARCHAR(32) NOT NULL COMMENT '关联柜子ID',
    slot_id              BIGINT NOT NULL COMMENT '关联格口',
    quantity             INT NOT NULL COMMENT '借用数量',
    returned_quantity    INT DEFAULT 0 COMMENT '已归还数量',
    borrower             VARCHAR(64) NOT NULL COMMENT '借用人',
    borrow_operator      VARCHAR(32) DEFAULT NULL COMMENT '借出操作人',
    return_operator      VARCHAR(32) DEFAULT NULL COMMENT '归还操作人',
    borrow_time          DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '借用时间',
    expected_return_time DATETIME DEFAULT NULL COMMENT '预计归还时间',
    return_time          DATETIME DEFAULT NULL COMMENT '实际全部归还时间',
    status               TINYINT DEFAULT 0 COMMENT '状态：0-借用中 1-已归还 2-部分归还',
    remark               TEXT COMMENT '备注',
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted              TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    KEY idx_item_id (item_id),
    KEY idx_cabinet_slot (cabinet_id, slot_id),
    KEY idx_borrower (borrower),
    KEY idx_status (status),
    KEY idx_borrow_time (borrow_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品借用记录表';
