USE cabinet_ledger;

ALTER TABLE cabinet
    DROP INDEX uk_cabinet_no;

ALTER TABLE cabinet
    ADD COLUMN active_cabinet_no INT GENERATED ALWAYS AS (CASE WHEN deleted = 0 THEN cabinet_no ELSE NULL END) STORED COMMENT '未删除柜号唯一键' AFTER deleted,
    ADD UNIQUE KEY uk_cabinet_active_no (active_cabinet_no);
