USE cabinet_ledger;

ALTER TABLE item
    ADD COLUMN warning_quantity INT DEFAULT 0 COMMENT '库存预警数量' AFTER standard_weight,
    ADD COLUMN max_quantity INT DEFAULT 0 COMMENT '最大库存数量' AFTER warning_quantity;

CREATE TABLE IF NOT EXISTS item_stock (
    id               BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id          BIGINT NOT NULL COMMENT '物品ID',
    cabinet_id       VARCHAR(32) DEFAULT NULL COMMENT '柜号',
    slot_id          BIGINT DEFAULT NULL COMMENT '格口ID',
    quantity         INT DEFAULT 0 COMMENT '当前库存数量',
    ledger_weight    DECIMAL(12,0) DEFAULT 0 COMMENT '台账重量（g）',
    actual_weight    DECIMAL(12,0) DEFAULT 0 COMMENT '最新称重重量（g）',
    warning_quantity INT DEFAULT 0 COMMENT '库存预警数量',
    max_quantity     INT DEFAULT 0 COMMENT '最大库存数量',
    stock_status     TINYINT DEFAULT 0 COMMENT '状态：0-正常 1-低库存 2-超库存 3-重量异常',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted          TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_item_id (item_id),
    KEY idx_cabinet_slot (cabinet_id, slot_id),
    KEY idx_slot_id (slot_id),
    KEY idx_stock_status (stock_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品库存表';

INSERT INTO item_stock (
    item_id,
    cabinet_id,
    slot_id,
    quantity,
    ledger_weight,
    actual_weight,
    warning_quantity,
    max_quantity,
    stock_status
)
SELECT
    i.id,
    cs.cabinet_id,
    cs.id AS slot_id,
    COALESCE(SUM(CASE WHEN il.status = 0 THEN il.quantity ELSE 0 END), 0) AS quantity,
    COALESCE(SUM(CASE WHEN il.status = 0 THEN il.total_weight ELSE 0 END), 0) AS ledger_weight,
    COALESCE(wr.weight, 0) AS actual_weight,
    COALESCE(i.warning_quantity, 0) AS warning_quantity,
    COALESCE(i.max_quantity, 0) AS max_quantity,
    0 AS stock_status
FROM item i
LEFT JOIN cabinet_slot cs ON cs.item_id = i.id AND cs.deleted = 0
LEFT JOIN item_ledger il ON il.item_id = i.id AND il.slot_id = cs.id AND il.deleted = 0
LEFT JOIN (
    SELECT wr1.slot_id, wr1.weight
    FROM weight_record wr1
    INNER JOIN (
        SELECT slot_id, MAX(recorded_at) AS recorded_at
        FROM weight_record
        WHERE deleted = 0
        GROUP BY slot_id
    ) latest ON latest.slot_id = wr1.slot_id AND latest.recorded_at = wr1.recorded_at
    WHERE wr1.deleted = 0
) wr ON wr.slot_id = cs.id
WHERE i.deleted = 0
GROUP BY
    i.id,
    cs.cabinet_id,
    cs.id,
    wr.weight,
    i.warning_quantity,
    i.max_quantity
ON DUPLICATE KEY UPDATE
    cabinet_id = VALUES(cabinet_id),
    slot_id = VALUES(slot_id),
    quantity = VALUES(quantity),
    ledger_weight = VALUES(ledger_weight),
    actual_weight = VALUES(actual_weight),
    warning_quantity = VALUES(warning_quantity),
    max_quantity = VALUES(max_quantity);

UPDATE item_stock
SET stock_status = CASE
    WHEN ABS(actual_weight - ledger_weight) > 5 THEN 3
    WHEN max_quantity > 0 AND quantity > max_quantity THEN 2
    WHEN warning_quantity > 0 AND quantity <= warning_quantity THEN 1
    ELSE 0
END
WHERE deleted = 0;
