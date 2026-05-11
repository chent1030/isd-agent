USE cabinet_ledger;

-- 如果 cabinet_slot 还没有 item_id，先执行这一句。
-- 如果已经有 item_id，跳过这一句。
ALTER TABLE cabinet_slot
    ADD COLUMN item_id BIGINT DEFAULT NULL COMMENT '绑定物品ID' AFTER slot_no;

-- 如果之前已经创建过普通索引 idx_item_id，需要先手动删除：
-- ALTER TABLE cabinet_slot DROP INDEX idx_item_id;
--
-- 该唯一索引用于保证一个物品只能绑定一个格口，避免领取时无法确定打开哪个门。
ALTER TABLE cabinet_slot
    ADD UNIQUE KEY uk_item_id (item_id);
