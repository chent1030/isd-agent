USE cabinet_ledger;

ALTER TABLE cabinet
    ADD COLUMN cabinet_no INT NULL COMMENT '柜号' AFTER id;

SET @cabinet_no_seed := 0;
UPDATE cabinet
SET cabinet_no = (@cabinet_no_seed := @cabinet_no_seed + 1)
WHERE cabinet_no IS NULL
ORDER BY id;

ALTER TABLE cabinet
    MODIFY cabinet_no INT NOT NULL COMMENT '柜号';

ALTER TABLE cabinet
    ADD COLUMN active_cabinet_no INT GENERATED ALWAYS AS (CASE WHEN deleted = 0 THEN cabinet_no ELSE NULL END) STORED COMMENT '未删除柜号唯一键' AFTER deleted,
    ADD UNIQUE KEY uk_cabinet_active_no (active_cabinet_no);

UPDATE cabinet_slot cs
INNER JOIN (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY cabinet_id ORDER BY id) AS generated_slot_no
    FROM cabinet_slot
) generated ON generated.id = cs.id
SET cs.slot_no = generated.generated_slot_no;

ALTER TABLE cabinet_slot
    MODIFY slot_no INT NOT NULL COMMENT '格口号';
