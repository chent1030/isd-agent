-- 行小助物品领用业务改造
-- 1. 物品库存仍保存在 item_stock.quantity
-- 2. 格口可取数量保存在 cabinet_slot.item_quantity
-- 3. 物品授权保存在 item_authorization

ALTER TABLE item
    ADD COLUMN auth_required TINYINT DEFAULT 0 COMMENT '是否需要人员授权：0-不需要 1-需要' AFTER max_quantity;

ALTER TABLE cabinet_slot
    ADD COLUMN item_quantity INT DEFAULT 0 COMMENT '当前格口分配物品数量' AFTER weight_limit;

ALTER TABLE cabinet_slot
    DROP INDEX uk_item_id;

CREATE TABLE IF NOT EXISTS item_authorization (
    id            BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id       BIGINT NOT NULL COMMENT '授权物品ID',
    employee_no   VARCHAR(64) NOT NULL COMMENT '授权人员工号',
    employee_name VARCHAR(64) DEFAULT NULL COMMENT '授权人员姓名',
    valid_from    DATETIME DEFAULT NULL COMMENT '授权开始时间',
    valid_to      DATETIME DEFAULT NULL COMMENT '授权结束时间，空表示长期有效',
    enabled       TINYINT DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    remark        TEXT COMMENT '备注',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    KEY idx_item_employee (item_id, employee_no),
    KEY idx_employee_no (employee_no),
    KEY idx_valid_time (valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品人员授权表';
