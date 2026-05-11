USE cabinet_ledger;

ALTER TABLE item_ledger
    ADD COLUMN operator_no VARCHAR(64) DEFAULT NULL COMMENT '业务操作人工号' AFTER status,
    ADD COLUMN operator_name VARCHAR(64) DEFAULT NULL COMMENT '业务操作人姓名' AFTER operator_no;

UPDATE item_ledger
SET operator_no = COALESCE(operator_no, stored_by, removed_by),
    operator_name = COALESCE(operator_name, stored_by, removed_by)
WHERE deleted = 0;

ALTER TABLE item_borrow_record
    ADD COLUMN borrow_operator_no VARCHAR(64) DEFAULT NULL COMMENT '借出操作人工号' AFTER borrow_operator,
    ADD COLUMN borrow_operator_name VARCHAR(64) DEFAULT NULL COMMENT '借出操作人姓名' AFTER borrow_operator_no,
    ADD COLUMN return_operator_no VARCHAR(64) DEFAULT NULL COMMENT '归还操作人工号' AFTER return_operator,
    ADD COLUMN return_operator_name VARCHAR(64) DEFAULT NULL COMMENT '归还操作人姓名' AFTER return_operator_no;

UPDATE item_borrow_record
SET borrow_operator_no = COALESCE(borrow_operator_no, borrow_operator),
    borrow_operator_name = COALESCE(borrow_operator_name, borrow_operator),
    return_operator_no = COALESCE(return_operator_no, return_operator),
    return_operator_name = COALESCE(return_operator_name, return_operator)
WHERE deleted = 0;
