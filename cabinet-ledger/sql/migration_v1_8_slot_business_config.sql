USE cabinet_ledger;

ALTER TABLE cabinet_slot
    ADD COLUMN weight_limit DECIMAL(12,0) DEFAULT 0 COMMENT '称重上限（g）' AFTER sensor_id;

UPDATE cabinet_slot cs
INNER JOIN cabinet c ON c.id = cs.cabinet_id
SET cs.weight_limit = COALESCE(c.weight_limit, 0)
WHERE cs.weight_limit IS NULL OR cs.weight_limit = 0;

ALTER TABLE cabinet_slot
    MODIFY board_addr VARCHAR(32) NULL COMMENT '锁控板地址',
    MODIFY lock_number VARCHAR(32) NULL COMMENT '锁号',
    MODIFY sensor_id VARCHAR(32) NULL COMMENT '称重模块传感器ID';

ALTER TABLE cabinet_slot
    DROP INDEX uk_board_lock;

ALTER TABLE cabinet_slot
    DROP INDEX idx_sensor_id;
