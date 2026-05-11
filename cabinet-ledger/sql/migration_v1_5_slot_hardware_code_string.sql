USE cabinet_ledger;

ALTER TABLE cabinet_slot
    MODIFY board_addr VARCHAR(32) NOT NULL COMMENT '锁控板地址',
    MODIFY lock_number VARCHAR(32) NOT NULL COMMENT '锁号';
