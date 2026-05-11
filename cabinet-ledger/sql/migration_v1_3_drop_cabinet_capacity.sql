USE cabinet_ledger;

-- 格口数量以 cabinet_slot 实际配置为准，不再维护 cabinet.capacity。
ALTER TABLE cabinet DROP COLUMN capacity;
