USE cabinet_ledger;

-- 将历史重量数据从 kg 转为 g。每个环境只执行一次。
UPDATE cabinet SET weight_limit = weight_limit * 1000 WHERE deleted = 0;
UPDATE cabinet_slot SET tare_weight = tare_weight * 1000 WHERE deleted = 0;
UPDATE weight_record SET weight = weight * 1000, change_amount = change_amount * 1000 WHERE deleted = 0;
UPDATE item SET standard_weight = standard_weight * 1000 WHERE deleted = 0;
UPDATE item_ledger SET total_weight = total_weight * 1000 WHERE deleted = 0;

ALTER TABLE cabinet
    MODIFY weight_limit DECIMAL(12,0) DEFAULT 0 COMMENT '称重上限（g）';

ALTER TABLE cabinet_slot
    MODIFY tare_weight DECIMAL(12,0) DEFAULT 0 COMMENT '去皮重量（g）';

ALTER TABLE weight_record
    MODIFY weight DECIMAL(12,0) NOT NULL COMMENT '重量值（g）',
    MODIFY change_amount DECIMAL(12,0) DEFAULT 0 COMMENT '变化量（g）';

ALTER TABLE item
    MODIFY standard_weight DECIMAL(12,0) DEFAULT 0 COMMENT '标准单件重量（g）';

ALTER TABLE item_ledger
    MODIFY total_weight DECIMAL(12,0) DEFAULT 0 COMMENT '总重量（g）';
