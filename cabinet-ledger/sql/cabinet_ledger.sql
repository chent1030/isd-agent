/*
 Navicat Premium Dump SQL

 Source Server         : 本地mysql
 Source Server Type    : MySQL
 Source Server Version : 90700 (9.7.0)
 Source Host           : localhost:3306
 Source Schema         : cabinet_ledger

 Target Server Type    : MySQL
 Target Server Version : 90700 (9.7.0)
 File Encoding         : 65001

 Date: 11/05/2026 10:31:32
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin_user
-- ----------------------------
DROP TABLE IF EXISTS `admin_user`;
CREATE TABLE `admin_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `username` varchar(64) NOT NULL COMMENT '登录账号',
  `display_name` varchar(64) DEFAULT NULL COMMENT '显示名称',
  `password_hash` varchar(128) NOT NULL COMMENT '密码哈希',
  `salt` varchar(64) NOT NULL COMMENT '密码盐',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-停用 1-启用',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员账号表';

-- ----------------------------
-- Records of admin_user
-- ----------------------------
BEGIN;
INSERT INTO `admin_user` (`id`, `username`, `display_name`, `password_hash`, `salt`, `status`, `last_login_at`, `created_at`, `updated_at`, `deleted`) VALUES (1, 'admin', '系统管理员', 'ff9304d943326a8ef0cb3bb8be4a3b4018411d81200416e1ad51c7d56147ab06', 'cabinet-ledger-default-salt', 1, NULL, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `admin_user` (`id`, `username`, `display_name`, `password_hash`, `salt`, `status`, `last_login_at`, `created_at`, `updated_at`, `deleted`) VALUES (2, '61016968', '陈涛', '9f95d1ba968a43ceee4f20107583c3b0a3e62fcaaf38e21d9ec3e9fea8705994', 'a0f455d4ea230415b9e28c65bf4844d2', 1, '2026-05-11 10:16:45', '2026-05-11 10:16:34', '2026-05-11 10:16:33', 0);
COMMIT;

-- ----------------------------
-- Table structure for cabinet
-- ----------------------------
DROP TABLE IF EXISTS `cabinet`;
CREATE TABLE `cabinet` (
  `id` varchar(32) NOT NULL COMMENT '柜子ID，内部唯一标识',
  `cabinet_no` int NOT NULL COMMENT '柜号',
  `name` varchar(64) NOT NULL COMMENT '柜子名称',
  `location` varchar(128) DEFAULT NULL COMMENT '存放位置',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-停用 1-启用 2-维护中',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  `active_cabinet_no` int GENERATED ALWAYS AS ((case when (`deleted` = 0) then `cabinet_no` else NULL end)) STORED COMMENT '未删除柜号唯一键',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cabinet_active_no` (`active_cabinet_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='智能柜表';

-- ----------------------------
-- Records of cabinet
-- ----------------------------
BEGIN;
INSERT INTO `cabinet` (`id`, `cabinet_no`, `name`, `location`, `status`, `created_at`, `updated_at`, `deleted`) VALUES ('UABC-001', 1, '左侧双排柜', '行政楼左侧双排柜', 1, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet` (`id`, `cabinet_no`, `name`, `location`, `status`, `created_at`, `updated_at`, `deleted`) VALUES ('UABC-002', 2, '右侧三排柜', '行政楼右侧三排柜', 1, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
COMMIT;

-- ----------------------------
-- Table structure for cabinet_slot
-- ----------------------------
DROP TABLE IF EXISTS `cabinet_slot`;
CREATE TABLE `cabinet_slot` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `cabinet_id` varchar(32) NOT NULL COMMENT '关联柜子ID',
  `slot_no` int NOT NULL COMMENT '格口号',
  `item_id` bigint DEFAULT NULL COMMENT '绑定物品ID',
  `board_addr` varchar(32) DEFAULT NULL COMMENT '锁控板地址',
  `lock_number` varchar(32) DEFAULT NULL COMMENT '锁号',
  `sensor_id` varchar(32) DEFAULT NULL COMMENT '称重模块传感器ID',
  `weight_limit` decimal(12,0) DEFAULT '0' COMMENT '称重上限（g）',
  `status` tinyint DEFAULT '0' COMMENT '状态：0-空闲 1-占用 2-故障',
  `tare_weight` decimal(12,0) DEFAULT '0' COMMENT '去皮重量（g）',
  `calibration_factor` decimal(10,6) DEFAULT '1.000000' COMMENT '校准系数',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cabinet_slot` (`cabinet_id`,`slot_no`),
  UNIQUE KEY `uk_item_id` (`item_id`),
  KEY `idx_cabinet_id` (`cabinet_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='柜格口表';

-- ----------------------------
-- Records of cabinet_slot
-- ----------------------------
BEGIN;
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (1, 'UABC-001', 1, 1, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (2, 'UABC-001', 2, 2, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (3, 'UABC-001', 3, 3, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (4, 'UABC-001', 4, 4, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (5, 'UABC-001', 5, 5, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (6, 'UABC-001', 6, 6, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (7, 'UABC-001', 7, 7, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (8, 'UABC-001', 8, 8, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (9, 'UABC-001', 9, 9, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (10, 'UABC-001', 10, 10, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (11, 'UABC-001', 11, 11, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (12, 'UABC-001', 12, 12, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (13, 'UABC-002', 1, 13, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (14, 'UABC-002', 2, 14, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (15, 'UABC-002', 3, 15, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (16, 'UABC-002', 4, 16, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (17, 'UABC-002', 5, 17, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (18, 'UABC-002', 6, 18, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (19, 'UABC-002', 7, 19, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (20, 'UABC-002', 8, 20, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (21, 'UABC-002', 9, 21, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (22, 'UABC-002', 10, 22, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (23, 'UABC-002', 11, 23, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (24, 'UABC-002', 12, 24, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (25, 'UABC-002', 13, 25, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (26, 'UABC-002', 14, 26, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (27, 'UABC-002', 15, 27, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (28, 'UABC-002', 16, 28, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (29, 'UABC-002', 17, 29, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
INSERT INTO `cabinet_slot` (`id`, `cabinet_id`, `slot_no`, `item_id`, `board_addr`, `lock_number`, `sensor_id`, `weight_limit`, `status`, `tare_weight`, `calibration_factor`, `created_at`, `deleted`) VALUES (30, 'UABC-002', 18, 30, NULL, NULL, NULL, 100000, 1, 0, 1.000000, '2026-05-11 09:52:10', 0);
COMMIT;

-- ----------------------------
-- Table structure for item
-- ----------------------------
DROP TABLE IF EXISTS `item`;
CREATE TABLE `item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `name` varchar(128) NOT NULL COMMENT '物品名称',
  `category` varchar(32) DEFAULT NULL COMMENT '物品类别',
  `spec` varchar(64) DEFAULT NULL COMMENT '规格型号',
  `standard_weight` decimal(12,0) DEFAULT '0' COMMENT '标准单件重量（g）',
  `use_type` tinyint DEFAULT '0' COMMENT '使用类型：0-领用 1-借用 2-领用/借用',
  `warning_quantity` int DEFAULT '0' COMMENT '库存预警数量',
  `max_quantity` int DEFAULT '0' COMMENT '最大库存数量',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物品基础信息表';

-- ----------------------------
-- Records of item
-- ----------------------------
BEGIN;
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (1, '田园礼品方案二', '礼盒', '盒装', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (2, '国源对开42°', '酒', '瓶', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (3, '泥绘井栏壶', '礼品', '套', 0, 0, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (4, '锐思充电宝', '充电宝', '个', 0, 0, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (5, '厂牌&厂牌绳', '办公用品', '套', 0, 0, 5, 50, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (6, '长尾夹', '办公用品', '个', 0, 0, 5, 50, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (7, '胶水&胶带', '办公用品', '个', 0, 0, 5, 50, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (8, '便签', '办公用品', '个', 0, 0, 5, 50, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (9, '奔富28', '酒', '瓶', 0, 0, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (10, '凌美咖啡杯套', '礼品', '套', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (11, '礼品袋', '礼品', '个', 0, 0, 5, 30, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (12, '矿泉水', '饮品', '瓶', 0, 0, 5, 30, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (13, '国源四开52°', '酒', '瓶', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (14, '国源四开42°', '酒', '瓶', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (15, '国源四开42°', '酒', '瓶', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (16, '国源单开52°', '酒', '瓶', 0, 0, 1, 4, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (17, '剑南春', '酒', '瓶', 0, 0, 1, 6, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (18, '五粮液', '酒', '瓶', 0, 0, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (19, '翻页笔', '办公用品', '个', 0, 1, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (20, '排插', '办公用品', '个', 0, 1, 1, 3, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (21, '板擦&白板笔', '办公用品', '个', 0, 0, 5, 20, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (22, '订书机&订书针', '办公用品', '个', 0, 0, 2, 10, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (23, '签字笔', '办公用品', '支', 0, 0, 5, 144, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (24, 'HDMI高清线', '办公用品', '根', 0, 1, 0, 10, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (25, '欧舒丹洗护套', '护肤用品', '套', 0, 0, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (26, '垫板', '办公用品', '块', 0, 1, 1, 10, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (27, '派克钢笔&香薰', '办公用品', '个', 0, 0, 1, 5, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (28, '大台签', '办公用品', '个', 0, 1, 3, 20, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (29, '小台签', '办公用品', '个', 0, 1, 3, 20, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
INSERT INTO `item` (`id`, `name`, `category`, `spec`, `standard_weight`, `use_type`, `warning_quantity`, `max_quantity`, `created_at`, `updated_at`, `deleted`) VALUES (30, '抽纸盒', '办公用品', '盒', 0, 0, 2, 15, '2026-05-11 09:52:10', '2026-05-11 09:52:10', 0);
COMMIT;

-- ----------------------------
-- Table structure for item_borrow_record
-- ----------------------------
DROP TABLE IF EXISTS `item_borrow_record`;
CREATE TABLE `item_borrow_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `item_id` bigint NOT NULL COMMENT '关联物品',
  `cabinet_id` varchar(32) NOT NULL COMMENT '关联柜子ID',
  `slot_id` bigint NOT NULL COMMENT '关联格口',
  `quantity` int NOT NULL COMMENT '借用数量',
  `returned_quantity` int DEFAULT '0' COMMENT '已归还数量',
  `borrower` varchar(64) NOT NULL COMMENT '借用人',
  `borrow_operator` varchar(32) DEFAULT NULL COMMENT '借出操作人',
  `borrow_operator_no` varchar(64) DEFAULT NULL COMMENT '借出操作人工号',
  `borrow_operator_name` varchar(64) DEFAULT NULL COMMENT '借出操作人姓名',
  `return_operator` varchar(32) DEFAULT NULL COMMENT '归还操作人',
  `return_operator_no` varchar(64) DEFAULT NULL COMMENT '归还操作人工号',
  `return_operator_name` varchar(64) DEFAULT NULL COMMENT '归还操作人姓名',
  `borrow_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '借用时间',
  `expected_return_time` datetime DEFAULT NULL COMMENT '预计归还时间',
  `return_time` datetime DEFAULT NULL COMMENT '实际全部归还时间',
  `status` tinyint DEFAULT '0' COMMENT '状态：0-借用中 1-已归还 2-部分归还',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_cabinet_slot` (`cabinet_id`,`slot_id`),
  KEY `idx_borrower` (`borrower`),
  KEY `idx_status` (`status`),
  KEY `idx_borrow_time` (`borrow_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物品借用记录表';

-- ----------------------------
-- Records of item_borrow_record
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for item_ledger
-- ----------------------------
DROP TABLE IF EXISTS `item_ledger`;
CREATE TABLE `item_ledger` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `item_id` bigint DEFAULT NULL COMMENT '关联物品',
  `cabinet_id` varchar(32) NOT NULL COMMENT '关联柜子ID',
  `slot_id` bigint NOT NULL COMMENT '关联格口',
  `quantity` int DEFAULT '1' COMMENT '数量',
  `total_weight` decimal(12,0) DEFAULT '0' COMMENT '总重量（g）',
  `operation_type` tinyint DEFAULT '0' COMMENT '操作类型：0-入库 1-领用 2-借用 3-归还',
  `status` tinyint DEFAULT '0' COMMENT '状态：0-在库 1-已取出 2-异常',
  `operator_no` varchar(64) DEFAULT NULL COMMENT '业务操作人工号',
  `operator_name` varchar(64) DEFAULT NULL COMMENT '业务操作人姓名',
  `stored_by` varchar(32) DEFAULT NULL COMMENT '存放人/领用人',
  `stored_at` datetime DEFAULT NULL COMMENT '存放时间',
  `removed_by` varchar(32) DEFAULT NULL COMMENT '取出人',
  `removed_at` datetime DEFAULT NULL COMMENT '取出时间',
  `weight_record_id` bigint DEFAULT NULL COMMENT '关联称重记录',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_cabinet_id` (`cabinet_id`),
  KEY `idx_slot_id` (`slot_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_weight_record_id` (`weight_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物品台账表';

-- ----------------------------
-- Records of item_ledger
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for item_stock
-- ----------------------------
DROP TABLE IF EXISTS `item_stock`;
CREATE TABLE `item_stock` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `item_id` bigint NOT NULL COMMENT '物品ID',
  `cabinet_id` varchar(32) DEFAULT NULL COMMENT '柜子ID',
  `slot_id` bigint DEFAULT NULL COMMENT '格口ID',
  `quantity` int DEFAULT '0' COMMENT '当前库存数量',
  `borrowed_quantity` int DEFAULT '0' COMMENT '外借未归还数量',
  `ledger_weight` decimal(12,0) DEFAULT '0' COMMENT '台账重量（g）',
  `actual_weight` decimal(12,0) DEFAULT '0' COMMENT '最新称重重量（g）',
  `warning_quantity` int DEFAULT '0' COMMENT '库存预警数量',
  `max_quantity` int DEFAULT '0' COMMENT '最大库存数量',
  `stock_status` tinyint DEFAULT '0' COMMENT '状态：0-正常 1-低库存 2-超库存 3-重量异常',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_id` (`item_id`),
  KEY `idx_cabinet_slot` (`cabinet_id`,`slot_id`),
  KEY `idx_slot_id` (`slot_id`),
  KEY `idx_stock_status` (`stock_status`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物品库存表';

-- ----------------------------
-- Records of item_stock
-- ----------------------------
BEGIN;
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (1, 1, 'UABC-001', 1, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:04:30', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (2, 2, 'UABC-001', 2, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:04:35', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (3, 3, 'UABC-001', 3, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:04:41', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (4, 4, 'UABC-001', 4, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:04:46', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (5, 5, 'UABC-001', 5, 50, 0, 0, 0, 0, 0, 0, '2026-05-11 10:04:56', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (6, 6, 'UABC-001', 6, 50, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:05', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (7, 7, 'UABC-001', 7, 50, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:17', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (8, 8, 'UABC-001', 8, 50, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:22', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (9, 9, 'UABC-001', 9, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:28', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (10, 10, 'UABC-001', 10, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:34', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (11, 11, 'UABC-001', 11, 30, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:47', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (12, 12, 'UABC-001', 12, 30, 0, 0, 0, 0, 0, 0, '2026-05-11 10:05:59', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (13, 13, 'UABC-002', 13, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:08', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (14, 14, 'UABC-002', 14, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:12', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (15, 15, 'UABC-002', 15, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:16', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (16, 16, 'UABC-002', 16, 4, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:22', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (17, 17, 'UABC-002', 17, 6, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:27', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (18, 18, 'UABC-002', 18, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:30', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (19, 19, 'UABC-002', 19, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:37', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (20, 20, 'UABC-002', 20, 3, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:41', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (21, 21, 'UABC-002', 21, 20, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:46', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (22, 22, 'UABC-002', 22, 10, 0, 0, 0, 0, 0, 0, '2026-05-11 10:06:58', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (23, 23, 'UABC-002', 23, 144, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:05', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (24, 24, 'UABC-002', 24, 1, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:08', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (25, 25, 'UABC-002', 25, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:22', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (26, 26, 'UABC-002', 26, 10, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:25', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (27, 27, 'UABC-002', 27, 5, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:29', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (28, 28, 'UABC-002', 28, 20, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:39', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (29, 29, 'UABC-002', 29, 20, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:43', 0);
INSERT INTO `item_stock` (`id`, `item_id`, `cabinet_id`, `slot_id`, `quantity`, `borrowed_quantity`, `ledger_weight`, `actual_weight`, `warning_quantity`, `max_quantity`, `stock_status`, `updated_at`, `deleted`) VALUES (30, 30, 'UABC-002', 30, 15, 0, 0, 0, 0, 0, 0, '2026-05-11 10:07:48', 0);
COMMIT;

-- ----------------------------
-- Table structure for operation_log
-- ----------------------------
DROP TABLE IF EXISTS `operation_log`;
CREATE TABLE `operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `cabinet_id` varchar(32) DEFAULT NULL COMMENT '关联柜子ID',
  `operator` varchar(32) DEFAULT NULL COMMENT '操作人',
  `action` varchar(32) NOT NULL COMMENT '操作类型',
  `detail` text COMMENT '操作详情',
  `ip_addr` varchar(64) DEFAULT NULL COMMENT 'IP地址',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_cabinet_id` (`cabinet_id`),
  KEY `idx_operator` (`operator`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='操作日志表';

-- ----------------------------
-- Records of operation_log
-- ----------------------------
BEGIN;
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (1, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：1，物品：1', '0:0:0:0:0:0:0:1', '2026-05-11 09:52:59');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (2, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：2，物品：2', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:03');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (3, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：3，物品：3', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:15');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (4, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：4，物品：4', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:20');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (5, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：5，物品：5', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:28');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (6, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：6，物品：6', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:34');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (7, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：7，物品：7', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:40');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (8, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：8，物品：8', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:48');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (9, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：9，物品：9', '0:0:0:0:0:0:0:1', '2026-05-11 09:53:55');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (10, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：10，物品：10', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:00');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (11, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：11，物品：11', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:08');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (12, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：12，物品：12', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:14');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (13, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：1，物品：13', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:28');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (14, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：2，物品：14', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:34');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (15, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：3，物品：15', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:40');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (16, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：4，物品：16', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:44');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (17, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：5，物品：17', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:50');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (18, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：6，物品：18', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:54');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (19, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：7，物品：19', '0:0:0:0:0:0:0:1', '2026-05-11 09:54:58');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (20, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：8，物品：20', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:02');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (21, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：9，物品：21', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:09');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (22, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：10，物品：22', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:15');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (23, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：11，物品：23', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:19');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (24, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：12，物品：24', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:23');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (25, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：13，物品：25', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:29');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (26, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：14，物品：26', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:34');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (27, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：15，物品：27', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:41');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (28, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：16，物品：28', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:46');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (29, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：17，物品：29', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:50');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (30, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：18，物品：30', '0:0:0:0:0:0:0:1', '2026-05-11 09:55:56');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (31, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：1，物品：1', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:33');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (32, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：2，物品：2', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:37');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (33, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：3，物品：3', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:40');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (34, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：4，物品：4', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:44');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (35, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：5，物品：5', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:47');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (36, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：6，物品：6', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:50');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (37, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：7，物品：7', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:53');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (38, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：8，物品：8', '0:0:0:0:0:0:0:1', '2026-05-11 10:01:56');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (39, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：9，物品：9', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:00');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (40, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：10，物品：10', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:03');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (41, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：11，物品：11', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:06');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (42, 'UABC-001', 'admin', 'SLOT_SAVE', '保存格口配置：12，物品：12', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:10');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (43, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：1，物品：13', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:24');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (44, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：2，物品：14', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:28');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (45, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：3，物品：15', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:30');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (46, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：4，物品：16', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:33');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (47, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：5，物品：17', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:36');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (48, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：6，物品：18', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:39');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (49, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：7，物品：19', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:42');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (50, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：8，物品：20', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:46');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (51, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：9，物品：21', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:50');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (52, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：10，物品：22', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:54');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (53, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：11，物品：23', '0:0:0:0:0:0:0:1', '2026-05-11 10:02:56');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (54, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：12，物品：24', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:00');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (55, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：13，物品：25', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:03');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (56, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：14，物品：26', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:06');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (57, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：15，物品：27', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:08');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (58, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：16，物品：28', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:12');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (59, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：17，物品：29', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:15');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (60, 'UABC-002', 'admin', 'SLOT_SAVE', '保存格口配置：18，物品：30', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:19');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (61, 'UABC-001', 'admin', 'CABINET_SAVE', '保存柜子配置：左侧双排柜', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:54');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (62, 'UABC-002', 'admin', 'CABINET_STATUS', '修改柜子状态为：1', '0:0:0:0:0:0:0:1', '2026-05-11 10:03:56');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (63, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：1', '0:0:0:0:0:0:0:1', '2026-05-11 10:04:30');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (64, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：2', '0:0:0:0:0:0:0:1', '2026-05-11 10:04:35');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (65, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：3', '0:0:0:0:0:0:0:1', '2026-05-11 10:04:41');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (66, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：4', '0:0:0:0:0:0:0:1', '2026-05-11 10:04:46');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (67, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：5', '0:0:0:0:0:0:0:1', '2026-05-11 10:04:56');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (68, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：6', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:05');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (69, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：7', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:17');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (70, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：8', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:22');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (71, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：9', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:28');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (72, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：10', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:34');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (73, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：11', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:47');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (74, 'UABC-001', 'admin', 'STOCK_SAVE', '修正库存，物品：12', '0:0:0:0:0:0:0:1', '2026-05-11 10:05:59');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (75, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：13', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:08');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (76, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：14', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:12');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (77, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：15', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:16');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (78, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：16', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:22');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (79, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：17', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:27');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (80, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：18', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:30');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (81, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：19', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:37');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (82, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：20', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:41');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (83, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：21', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:46');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (84, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：22', '0:0:0:0:0:0:0:1', '2026-05-11 10:06:58');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (85, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：23', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:05');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (86, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：24', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:08');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (87, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：25', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:22');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (88, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：26', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:25');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (89, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：27', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:29');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (90, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：28', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:39');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (91, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：29', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:43');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (92, 'UABC-002', 'admin', 'STOCK_SAVE', '修正库存，物品：30', '0:0:0:0:0:0:0:1', '2026-05-11 10:07:49');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (93, NULL, 'admin', 'ADMIN_USER_SAVE', '保存管理员账号：61016968', '0:0:0:0:0:0:0:1', '2026-05-11 10:16:34');
INSERT INTO `operation_log` (`id`, `cabinet_id`, `operator`, `action`, `detail`, `ip_addr`, `created_at`) VALUES (94, NULL, '61016968', 'LOGIN', '管理员登录', '0:0:0:0:0:0:0:1', '2026-05-11 10:16:45');
COMMIT;

-- ----------------------------
-- Table structure for weight_record
-- ----------------------------
DROP TABLE IF EXISTS `weight_record`;
CREATE TABLE `weight_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `cabinet_id` varchar(32) NOT NULL COMMENT '关联柜子ID',
  `slot_id` bigint NOT NULL COMMENT '关联格口',
  `weight` decimal(12,0) NOT NULL COMMENT '重量值（g）',
  `change_amount` decimal(12,0) DEFAULT '0' COMMENT '变化量（g）',
  `event_type` tinyint DEFAULT '0' COMMENT '事件：0-定时采集 1-增加 2-减少',
  `recorded_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_cabinet_id` (`cabinet_id`),
  KEY `idx_slot_id` (`slot_id`),
  KEY `idx_recorded_at` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='称重记录表';

-- ----------------------------
-- Records of weight_record
-- ----------------------------
BEGIN;
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
