-- 创建数据库
CREATE DATABASE IF NOT EXISTS cabinet_ledger
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE cabinet_ledger;

-- 智能柜表
CREATE TABLE IF NOT EXISTS cabinet (
    id           VARCHAR(32) NOT NULL COMMENT '柜子ID，内部唯一标识',
    cabinet_no   INT NOT NULL COMMENT '柜号',
    name         VARCHAR(64) NOT NULL COMMENT '柜子名称',
    location     VARCHAR(128) DEFAULT NULL COMMENT '存放位置',
    status       TINYINT DEFAULT 1 COMMENT '状态：0-停用 1-启用 2-维护中',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted      TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    active_cabinet_no INT GENERATED ALWAYS AS (CASE WHEN deleted = 0 THEN cabinet_no ELSE NULL END) STORED COMMENT '未删除柜号唯一键',
    PRIMARY KEY (id),
    UNIQUE KEY uk_cabinet_active_no (active_cabinet_no),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能柜表';

-- 柜格口表
CREATE TABLE IF NOT EXISTS cabinet_slot (
    id                 BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    cabinet_id         VARCHAR(32) NOT NULL COMMENT '关联柜子ID',
    slot_no            INT NOT NULL COMMENT '格口号',
    item_id            BIGINT DEFAULT NULL COMMENT '绑定物品ID',
    board_addr         VARCHAR(32) DEFAULT NULL COMMENT '锁控板地址',
    lock_number        VARCHAR(32) DEFAULT NULL COMMENT '锁号',
    sensor_id          VARCHAR(32) DEFAULT NULL COMMENT '称重模块传感器ID',
    weight_limit       DECIMAL(12,0) DEFAULT 0 COMMENT '称重上限（g）',
    status             TINYINT DEFAULT 0 COMMENT '状态：0-空闲 1-占用 2-故障',
    tare_weight        DECIMAL(12,0) DEFAULT 0 COMMENT '去皮重量（g）',
    calibration_factor DECIMAL(10,6) DEFAULT 1.000000 COMMENT '校准系数',
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted            TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_cabinet_slot (cabinet_id, slot_no),
    UNIQUE KEY uk_item_id (item_id),
    KEY idx_cabinet_id (cabinet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='柜格口表';

-- 称重记录表
CREATE TABLE IF NOT EXISTS weight_record (
    id            BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    cabinet_id    VARCHAR(32) NOT NULL COMMENT '关联柜子ID',
    slot_id       BIGINT NOT NULL COMMENT '关联格口',
    weight        DECIMAL(12,0) NOT NULL COMMENT '重量值（g）',
    change_amount DECIMAL(12,0) DEFAULT 0 COMMENT '变化量（g）',
    event_type    TINYINT DEFAULT 0 COMMENT '事件：0-定时采集 1-增加 2-减少',
    recorded_at   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    KEY idx_cabinet_id (cabinet_id),
    KEY idx_slot_id (slot_id),
    KEY idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='称重记录表';

-- 物品基础信息表
CREATE TABLE IF NOT EXISTS item (
    id              BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    name            VARCHAR(128) NOT NULL COMMENT '物品名称',
    category        VARCHAR(32) DEFAULT NULL COMMENT '物品类别',
    spec            VARCHAR(64) DEFAULT NULL COMMENT '规格型号',
    standard_weight DECIMAL(12,0) DEFAULT 0 COMMENT '标准单件重量（g）',
    use_type        TINYINT DEFAULT 0 COMMENT '使用类型：0-领用 1-借用 2-领用/借用',
    warning_quantity INT DEFAULT 0 COMMENT '库存预警数量',
    max_quantity     INT DEFAULT 0 COMMENT '最大库存数量',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted         TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    KEY idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品基础信息表';

-- 物品台账表
CREATE TABLE IF NOT EXISTS item_ledger (
    id               BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id          BIGINT DEFAULT NULL COMMENT '关联物品',
    cabinet_id       VARCHAR(32) NOT NULL COMMENT '关联柜子ID',
    slot_id          BIGINT NOT NULL COMMENT '关联格口',
    quantity         INT DEFAULT 1 COMMENT '数量',
    total_weight     DECIMAL(12,0) DEFAULT 0 COMMENT '总重量（g）',
    operation_type   TINYINT DEFAULT 0 COMMENT '操作类型：0-入库 1-领用 2-借用 3-归还',
    status           TINYINT DEFAULT 0 COMMENT '状态：0-在库 1-已取出 2-异常',
    stored_by        VARCHAR(32) DEFAULT NULL COMMENT '存放人/领用人',
    stored_at        DATETIME DEFAULT NULL COMMENT '存放时间',
    removed_by       VARCHAR(32) DEFAULT NULL COMMENT '取出人',
    removed_at       DATETIME DEFAULT NULL COMMENT '取出时间',
    weight_record_id BIGINT DEFAULT NULL COMMENT '关联称重记录',
    remark           TEXT COMMENT '备注',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted          TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    KEY idx_cabinet_id (cabinet_id),
    KEY idx_slot_id (slot_id),
    KEY idx_item_id (item_id),
    KEY idx_weight_record_id (weight_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品台账表';

-- 物品库存表
CREATE TABLE IF NOT EXISTS item_stock (
    id               BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id          BIGINT NOT NULL COMMENT '物品ID',
    cabinet_id       VARCHAR(32) DEFAULT NULL COMMENT '柜子ID',
    slot_id          BIGINT DEFAULT NULL COMMENT '格口ID',
    quantity         INT DEFAULT 0 COMMENT '当前库存数量',
    borrowed_quantity INT DEFAULT 0 COMMENT '外借未归还数量',
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

-- 物品借用记录表
CREATE TABLE IF NOT EXISTS item_borrow_record (
    id                   BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id              BIGINT NOT NULL COMMENT '关联物品',
    cabinet_id           VARCHAR(32) NOT NULL COMMENT '关联柜子ID',
    slot_id              BIGINT NOT NULL COMMENT '关联格口',
    quantity             INT NOT NULL COMMENT '借用数量',
    returned_quantity    INT DEFAULT 0 COMMENT '已归还数量',
    borrower             VARCHAR(64) NOT NULL COMMENT '借用人',
    borrow_operator      VARCHAR(32) DEFAULT NULL COMMENT '借出操作人',
    return_operator      VARCHAR(32) DEFAULT NULL COMMENT '归还操作人',
    borrow_time          DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '借用时间',
    expected_return_time DATETIME DEFAULT NULL COMMENT '预计归还时间',
    return_time          DATETIME DEFAULT NULL COMMENT '实际全部归还时间',
    status               TINYINT DEFAULT 0 COMMENT '状态：0-借用中 1-已归还 2-部分归还',
    remark               TEXT COMMENT '备注',
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted              TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    KEY idx_item_id (item_id),
    KEY idx_cabinet_slot (cabinet_id, slot_id),
    KEY idx_borrower (borrower),
    KEY idx_status (status),
    KEY idx_borrow_time (borrow_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品借用记录表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
    id         BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    cabinet_id VARCHAR(32) DEFAULT NULL COMMENT '关联柜子ID',
    operator   VARCHAR(32) DEFAULT NULL COMMENT '操作人',
    action     VARCHAR(32) NOT NULL COMMENT '操作类型',
    detail     TEXT COMMENT '操作详情',
    ip_addr    VARCHAR(64) DEFAULT NULL COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id),
    KEY idx_cabinet_id (cabinet_id),
    KEY idx_operator (operator),
    KEY idx_action (action),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 管理员账号表
CREATE TABLE IF NOT EXISTS admin_user (
    id            BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    username      VARCHAR(64) NOT NULL COMMENT '登录账号',
    display_name  VARCHAR(64) DEFAULT NULL COMMENT '显示名称',
    password_hash VARCHAR(128) NOT NULL COMMENT '密码哈希',
    salt          VARCHAR(64) NOT NULL COMMENT '密码盐',
    status        TINYINT DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员账号表';

-- 测试数据
INSERT INTO cabinet (id, cabinet_no, name, location, status) VALUES
('UABC-001', 1, '左侧双排柜', '行政楼左侧双排柜', 0),
('UABC-002', 2, '右侧三排柜', '行政楼右侧三排柜', 0);

INSERT INTO item (id, name, category, spec, standard_weight, use_type, warning_quantity, max_quantity) VALUES
(1, '田园礼品方案二', '礼盒', '盒装', 0, 0, 1, 4),
(2, '国源对开42°', '酒', '瓶', 0, 0, 1, 4),
(3, '泥绘井栏壶', '礼品', '套', 0, 0, 1, 5),
(4, '锐思充电宝', '充电宝', '个', 0, 0, 1, 5),
(5, '厂牌&厂牌绳', '办公用品', '套', 0, 0, 5, 50),
(6, '长尾夹', '办公用品', '个', 0, 0, 5, 50),
(7, '胶水&胶带', '办公用品', '个', 0, 0, 5, 50),
(8, '便签', '办公用品', '个', 0, 0, 5, 50),
(9, '奔富28', '酒', '瓶', 0, 0, 1, 5),
(10, '凌美咖啡杯套', '礼品', '套', 0, 0, 1, 4),
(11, '礼品袋', '礼品', '个', 0, 0, 5, 30),
(12, '矿泉水', '饮品', '瓶', 0, 0, 5, 30),

(13, '国源四开52°', '酒', '瓶', 0, 0, 1, 4),
(14, '国源四开42°', '酒', '瓶', 0, 0, 1, 4),
(15, '国源四开42°', '酒', '瓶', 0, 0, 1, 4),
(16, '国源单开52°', '酒', '瓶', 0, 0, 1, 4),
(17, '剑南春', '酒', '瓶', 0, 0, 1, 6),
(18, '五粮液', '酒', '瓶', 0, 0, 1, 5),
(19, '翻页笔', '办公用品', '个', 0, 1, 1, 5),
(20, '排插', '办公用品', '个', 0, 1, 1, 3),
(21, '板擦&白板笔', '办公用品', '个', 0, 0, 5, 20),
(22, '订书机&订书针', '办公用品', '个', 0, 0, 2, 10),
(23, '签字笔', '办公用品', '支', 0, 0, 5, 144),
(24, 'HDMI高清线', '办公用品', '根', 0, 1, 0, 10),
(25, '欧舒丹洗护套', '护肤用品', '套', 0, 0, 1, 5),
(26, '垫板', '办公用品', '块', 0, 1, 1, 10),
(27, '派克钢笔&香薰', '办公用品', '个', 0, 0, 1, 5),
(28, '大台签', '办公用品', '个', 0, 1, 3, 20),
(29, '小台签', '办公用品', '个', 0, 1, 3, 20),
(30, '抽纸盒', '办公用品', '盒', 0, 0, 2, 15);

INSERT INTO cabinet_slot (id, cabinet_id, slot_no, item_id, weight_limit, status) VALUES
(1, 'UABC-001', 1, NULL, 100000, 0),
(2, 'UABC-001', 2, NULL, 100000, 0),
(3, 'UABC-001', 3, NULL, 100000, 0),
(4, 'UABC-001', 4, NULL, 100000, 0),
(5, 'UABC-001', 5, NULL, 100000, 0),
(6, 'UABC-001', 6, NULL, 100000, 0),
(7, 'UABC-001', 7, NULL, 100000, 0),
(8, 'UABC-001', 8, NULL, 100000, 0),
(9, 'UABC-001', 9, NULL, 100000, 0),
(10, 'UABC-001', 10, NULL, 100000, 0),
(11, 'UABC-001', 11, NULL, 100000, 0),
(12, 'UABC-001', 12, NULL, 100000, 0),

(13, 'UABC-002', 1, NULL, 100000, 0),
(14, 'UABC-002', 2, NULL, 100000, 0),
(15, 'UABC-002', 3, NULL, 100000, 0),
(16, 'UABC-002', 4, NULL, 100000, 0),
(17, 'UABC-002', 5, NULL, 100000, 0),
(18, 'UABC-002', 6, NULL, 100000, 0),
(19, 'UABC-002', 7, NULL, 100000, 0),
(20, 'UABC-002', 8, NULL, 100000, 0),
(21, 'UABC-002', 9, NULL, 100000, 0),
(22, 'UABC-002', 10, NULL, 100000, 0),
(23, 'UABC-002', 11, NULL, 100000, 0),
(24, 'UABC-002', 12, NULL, 100000, 0),
(25, 'UABC-002', 13, NULL, 100000, 0),
(26, 'UABC-002', 14, NULL, 100000, 0),
(27, 'UABC-002', 15, NULL, 100000, 0),
(28, 'UABC-002', 16, NULL, 100000, 0),
(29, 'UABC-002', 17, NULL, 100000, 0),
(30, 'UABC-002', 18, NULL, 100000, 0);

-- 默认账号：admin / admin123；上线前请修改密码
INSERT INTO admin_user (username, display_name, password_hash, salt, status) VALUES
('admin', '系统管理员', 'ff9304d943326a8ef0cb3bb8be4a3b4018411d81200416e1ad51c7d56147ab06', 'cabinet-ledger-default-salt', 1);
