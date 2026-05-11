# 智能柜物品台账管理系统 实现计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 基于 PRD 实现完整的智能柜物品台账管理系统，包含 Spring Boot 后端 + Vue3 前端

**Architecture:**
- 后端：Spring Boot 3.x + MySQL + MyBatis-Plus (io.choerodon.mybatis)
- 分页：PageHelper.doPage(PageRequest, () -> query)
- 前端：Vue3 + Element Plus + Axios
- 数据库：MySQL 8.0

---

## 项目结构

```
cabinet-ledger/
├── backend/                          # Spring Boot 后端
│   ├── src/main/java/com/cabinet/
│   │   ├── CabinetLedgerApplication.java
│   │   ├── config/                   # 配置类
│   │   ├── controller/               # 控制器层
│   │   ├── service/                # 服务层
│   │   ├── service/impl/           # 服务实现
│   │   ├── mapper/                 # MyBatis Mapper
│   │   ├── entity/                 # 实体类
│   │   ├── dto/                    # 数据传输对象
│   │   ├── vo/                     # 视图对象
│   │   ├── enums/                  # 枚举类
│   │   └── utils/                  # 工具类
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   └── mapper/                 # XML 映射文件
│   └── pom.xml
├── frontend/                         # Vue3 前端
│   ├── src/
│   │   ├── api/                    # API 接口
│   │   ├── views/                  # 页面组件
│   │   ├── components/             # 公共组件
│   │   ├── router/                 # 路由配置
│   │   ├── store/                  # Pinia 状态管理
│   │   └── utils/                  # 工具函数
│   ├── package.json
│   └── vite.config.js
└── sql/                              # 数据库脚本
    └── init.sql
```

---

## 任务列表

### Phase 1: 后端基础搭建

#### Task 1: 创建 Spring Boot 项目结构和 POM 配置
**Objective:** 初始化 Maven 项目，配置依赖

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/cabinet/CabinetLedgerApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-dev.yml`

**Code:**

pom.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.cabinet</groupId>
    <artifactId>cabinet-ledger</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.5</mybatis-plus.version>
        <choerodon.mybatis.version>2.1.0</choerodon.mybatis.version>
        <mysql.version>8.0.33</mysql.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- MyBatis Plus -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>
        
        <!-- Choerodon MyBatis -->
        <dependency>
            <groupId>io.choerodon</groupId>
            <artifactId>choerodon-mybatis</artifactId>
            <version>${choerodon.mybatis.version}</version>
        </dependency>
        
        <!-- MySQL -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

CabinetLedgerApplication.java:
```java
package com.cabinet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CabinetLedgerApplication {
    public static void main(String[] args) {
        SpringApplication.run(CabinetLedgerApplication.class, args);
    }
}
```

application.yml:
```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  profiles:
    active: dev
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  mapper-locations: classpath:/mapper/**/*.xml
```

application-dev.yml:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cabinet_ledger?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
```

**Verification:**
```bash
cd /Users/csai/project/isd-robot/cabinet-ledger/backend
mvn clean compile
```
Expected: BUILD SUCCESS

---

#### Task 2: 创建数据库表结构 SQL
**Objective:** 创建 MySQL 数据库初始化脚本

**Files:**
- Create: `sql/init.sql`

**Code:**
```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS cabinet_ledger 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE cabinet_ledger;

-- 智能柜表
CREATE TABLE IF NOT EXISTS cabinet (
    id VARCHAR(32) NOT NULL COMMENT '柜号',
    name VARCHAR(64) NOT NULL COMMENT '柜子名称',
    location VARCHAR(128) DEFAULT NULL COMMENT '存放位置',
    capacity INT DEFAULT 0 COMMENT '设计容量（格口数）',
    weight_limit DECIMAL(10,2) DEFAULT 0.00 COMMENT '称重上限（kg）',
    status TINYINT DEFAULT 1 COMMENT '状态：0-停用 1-启用 2-维护中',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除 1-已删除',
    PRIMARY KEY (id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能柜表';

-- 柜格口表
CREATE TABLE IF NOT EXISTS cabinet_slot (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    cabinet_id VARCHAR(32) NOT NULL COMMENT '关联柜号',
    slot_no VARCHAR(16) NOT NULL COMMENT '格口编号',
    board_addr VARCHAR(32) NOT NULL COMMENT '锁控板地址编码',
    lock_number VARCHAR(32) NOT NULL COMMENT '锁号编码',
    sensor_id VARCHAR(32) DEFAULT NULL COMMENT '称重模块传感器ID',
    status TINYINT DEFAULT 0 COMMENT '状态：0-空闲 1-占用 2-故障',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_cabinet_slot (cabinet_id, slot_no),
    INDEX idx_board_lock (board_addr, lock_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='柜格口表';

-- 称重记录表
CREATE TABLE IF NOT EXISTS weight_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    cabinet_id VARCHAR(32) NOT NULL COMMENT '关联柜号',
    slot_id BIGINT DEFAULT NULL COMMENT '关联格口',
    weight DECIMAL(10,3) NOT NULL COMMENT '重量值（kg）',
    change_amount DECIMAL(10,3) DEFAULT NULL COMMENT '变化量',
    event_type TINYINT DEFAULT 0 COMMENT '事件：0-定时采集 1-增加 2-减少',
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    INDEX idx_cabinet_time (cabinet_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='称重记录表';

-- 物品基础信息表
CREATE TABLE IF NOT EXISTS item (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    name VARCHAR(128) NOT NULL COMMENT '物品名称',
    category VARCHAR(32) DEFAULT NULL COMMENT '物品类别',
    spec VARCHAR(64) DEFAULT NULL COMMENT '规格型号',
    standard_weight DECIMAL(10,3) DEFAULT NULL COMMENT '标准单件重量（kg）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品基础信息表';

-- 物品台账表
CREATE TABLE IF NOT EXISTS item_ledger (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    item_id BIGINT NOT NULL COMMENT '关联物品',
    cabinet_id VARCHAR(32) NOT NULL COMMENT '关联柜号',
    slot_id BIGINT DEFAULT NULL COMMENT '关联格口',
    quantity INT DEFAULT 1 COMMENT '数量',
    total_weight DECIMAL(10,3) DEFAULT NULL COMMENT '总重量',
    status TINYINT DEFAULT 0 COMMENT '状态：0-在库 1-已取出',
    stored_by VARCHAR(32) DEFAULT NULL COMMENT '存放人/领用人',
    stored_at DATETIME DEFAULT NULL COMMENT '存放/领用时间',
    removed_by VARCHAR(32) DEFAULT NULL COMMENT '归还人',
    removed_at DATETIME DEFAULT NULL COMMENT '归还时间',
    weight_record_id BIGINT DEFAULT NULL COMMENT '关联称重记录',
    remark TEXT DEFAULT NULL COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    INDEX idx_cabinet_status (cabinet_id, status),
    INDEX idx_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品台账表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    cabinet_id VARCHAR(32) DEFAULT NULL COMMENT '关联柜号',
    operator VARCHAR(32) NOT NULL COMMENT '操作人',
    action VARCHAR(32) NOT NULL COMMENT '操作类型',
    detail TEXT DEFAULT NULL COMMENT '操作详情',
    ip_addr VARCHAR(32) DEFAULT NULL COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id),
    INDEX idx_cabinet_time (cabinet_id, created_at),
    INDEX idx_operator (operator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入测试数据
INSERT INTO cabinet (id, name, location, capacity, weight_limit, status) VALUES
('A01', 'A区工具柜01', 'A区车间', 10, 100.00, 1),
('A02', 'A区工具柜02', 'A区车间', 10, 100.00, 1),
('B01', 'B区零件柜01', 'B区仓库', 20, 200.00, 1);

INSERT INTO cabinet_slot (cabinet_id, slot_no, board_addr, lock_number, sensor_id, status) VALUES
('A01', '01', '0x01', '01', 'S01', 0),
('A01', '02', '0x01', '02', 'S02', 0),
('A01', '03', '0x01', '03', 'S03', 0),
('A02', '01', '0x02', '01', 'S04', 0),
('A02', '02', '0x02', '02', 'S05', 0),
('B01', '01', '0x03', '01', 'S06', 0);

INSERT INTO item (name, category, spec, standard_weight) VALUES
('螺丝刀套装', '工具', '6件套', 0.850),
('扳手', '工具', '10mm', 0.350),
('电阻', '电子元件', '1KΩ', 0.001),
('电容', '电子元件', '100μF', 0.002);
```

**Verification:**
```bash
mysql -u root -p < /Users/csai/project/isd-robot/cabinet-ledger/sql/init.sql
```

---

#### Task 3: 创建实体类和枚举
**Objective:** 创建与数据库表对应的实体类和状态枚举

**Files:**
- Create: `backend/src/main/java/com/cabinet/entity/Cabinet.java`
- Create: `backend/src/main/java/com/cabinet/entity/CabinetSlot.java`
- Create: `backend/src/main/java/com/cabinet/entity/WeightRecord.java`
- Create: `backend/src/main/java/com/cabinet/entity/Item.java`
- Create: `backend/src/main/java/com/cabinet/entity/ItemLedger.java`
- Create: `backend/src/main/java/com/cabinet/entity/OperationLog.java`
- Create: `backend/src/main/java/com/cabinet/enums/CabinetStatus.java`
- Create: `backend/src/main/java/com/cabinet/enums/SlotStatus.java`
- Create: `backend/src/main/java/com/cabinet/enums/LedgerStatus.java`
- Create: `backend/src/main/java/com/cabinet/enums/WeightEventType.java`

**Code (关键实体):**

Cabinet.java:
```java
package com.cabinet.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("cabinet")
public class Cabinet {
    @TableId(type = IdType.INPUT)
    private String id;
    private String name;
    private String location;
    private Integer capacity;
    private BigDecimal weightLimit;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private Integer deleted;
}
```

ItemLedger.java:
```java
package com.cabinet.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("item_ledger")
public class ItemLedger {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long itemId;
    private String cabinetId;
    private Long slotId;
    private Integer quantity;
    private BigDecimal totalWeight;
    private Integer status;
    private String storedBy;
    private LocalDateTime storedAt;
    private String removedBy;
    private LocalDateTime removedAt;
    private Long weightRecordId;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private Integer deleted;
}
```

枚举类示例:
```java
package com.cabinet.enums;

public enum CabinetStatus {
    DISABLED(0, "停用"),
    ENABLED(1, "启用"),
    MAINTENANCE(2, "维护中");
    
    private final int code;
    private final String desc;
    
    CabinetStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
    
    public int getCode() { return code; }
    public String getDesc() { return desc; }
}
```

---

#### Task 4: 创建 MyBatis Mapper 接口和 XML
**Objective:** 创建数据访问层

**Files:**
- Create: `backend/src/main/java/com/cabinet/mapper/CabinetMapper.java`
- Create: `backend/src/main/java/com/cabinet/mapper/CabinetSlotMapper.java`
- Create: `backend/src/main/java/com/cabinet/mapper/WeightRecordMapper.java`
- Create: `backend/src/main/java/com/cabinet/mapper/ItemMapper.java`
- Create: `backend/src/main/java/com/cabinet/mapper/ItemLedgerMapper.java`
- Create: `backend/src/main/java/com/cabinet/mapper/OperationLogMapper.java`
- Create: `backend/src/main/resources/mapper/CabinetMapper.xml`
- Create: `backend/src/main/resources/mapper/ItemLedgerMapper.xml`

**Code:**

CabinetMapper.java:
```java
package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cabinet.entity.Cabinet;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CabinetMapper extends BaseMapper<Cabinet> {
    
    @Select("SELECT c.*, COUNT(cs.id) as usedSlots " +
            "FROM cabinet c " +
            "LEFT JOIN cabinet_slot cs ON c.id = cs.cabinet_id AND cs.status = 1 " +
            "WHERE c.deleted = 0 AND c.id = #{id} " +
            "GROUP BY c.id")
    Cabinet selectCabinetWithStats(@Param("id") String id);
}
```

ItemLedgerMapper.java:
```java
package com.cabinet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cabinet.entity.ItemLedger;
import com.cabinet.vo.LedgerVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ItemLedgerMapper extends BaseMapper<ItemLedger> {
    
    List<LedgerVO> selectLedgerList(@Param("cabinetId") String cabinetId,
                                    @Param("status") Integer status,
                                    @Param("category") String category);
}
```

ItemLedgerMapper.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.cabinet.mapper.ItemLedgerMapper">
    
    <resultMap id="LedgerVOMap" type="com.cabinet.vo.LedgerVO">
        <id column="id" property="id"/>
        <result column="item_name" property="itemName"/>
        <result column="category" property="category"/>
        <result column="spec" property="spec"/>
        <result column="slot_no" property="slotNo"/>
        <result column="quantity" property="quantity"/>
        <result column="total_weight" property="totalWeight"/>
        <result column="status" property="status"/>
        <result column="stored_by" property="storedBy"/>
        <result column="stored_at" property="storedAt"/>
    </resultMap>
    
    <select id="selectLedgerList" resultMap="LedgerVOMap">
        SELECT 
            il.id,
            i.name as item_name,
            i.category,
            i.spec,
            cs.slot_no,
            il.quantity,
            il.total_weight,
            il.status,
            il.stored_by,
            il.stored_at
        FROM item_ledger il
        LEFT JOIN item i ON il.item_id = i.id
        LEFT JOIN cabinet_slot cs ON il.slot_id = cs.id
        WHERE il.deleted = 0
        <if test="cabinetId != null and cabinetId != ''">
            AND il.cabinet_id = #{cabinetId}
        </if>
        <if test="status != null">
            AND il.status = #{status}
        </if>
        <if test="category != null and category != ''">
            AND i.category = #{category}
        </if>
        ORDER BY il.created_at DESC
    </select>
</mapper>
```

---

#### Task 5: 创建 DTO 和 VO
**Objective:** 创建数据传输对象和视图对象

**Files:**
- Create: `backend/src/main/java/com/cabinet/dto/CabinetDTO.java`
- Create: `backend/src/main/java/com/cabinet/dto/SlotDTO.java`
- Create: `backend/src/main/java/com/cabinet/dto/WeightReportDTO.java`
- Create: `backend/src/main/java/com/cabinet/dto/DoorOpenDTO.java`
- Create: `backend/src/main/java/com/cabinet/dto/InventoryCheckDTO.java`
- Create: `backend/src/main/java/com/cabinet/vo/CabinetVO.java`
- Create: `backend/src/main/java/com/cabinet/vo/LedgerVO.java`
- Create: `backend/src/main/java/com/cabinet/vo/WeightRecordVO.java`
- Create: `backend/src/main/java/com/cabinet/vo/InventoryCheckVO.java`
- Create: `backend/src/main/java/com/cabinet/common/PageResult.java`
- Create: `backend/src/main/java/com/cabinet/common/Result.java`

**Code:**

Result.java:
```java
package com.cabinet.common;

import lombok.Data;

@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }
    
    public static <T> Result<T> error(String message) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMessage(message);
        return result;
    }
}
```

PageResult.java:
```java
package com.cabinet.common;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {
    private Long total;
    private Integer page;
    private Integer pageSize;
    private List<T> list;
}
```

LedgerVO.java:
```java
package com.cabinet.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class LedgerVO {
    private Long id;
    private String itemName;
    private String category;
    private String spec;
    private String slotNo;
    private Integer quantity;
    private BigDecimal totalWeight;
    private Integer status;
    private String storedBy;
    private LocalDateTime storedAt;
}
```

---

#### Task 6: 创建 Service 层和分页配置
**Objective:** 实现业务逻辑层，配置 Choerodon 分页

**Files:**
- Create: `backend/src/main/java/com/cabinet/service/CabinetService.java`
- Create: `backend/src/main/java/com/cabinet/service/impl/CabinetServiceImpl.java`
- Create: `backend/src/main/java/com/cabinet/service/ItemLedgerService.java`
- Create: `backend/src/main/java/com/cabinet/service/impl/ItemLedgerServiceImpl.java`
- Create: `backend/src/main/java/com/cabinet/service/WeightRecordService.java`
- Create: `backend/src/main/java/com/cabinet/service/impl/WeightRecordServiceImpl.java`
- Create: `backend/src/main/java/com/cabinet/config/MybatisConfig.java`

**Code:**

MybatisConfig.java:
```java
package com.cabinet.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisConfig {
    
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        return interceptor;
    }
}
```

ItemLedgerService.java:
```java
package com.cabinet.service;

import com.cabinet.common.PageResult;
import com.cabinet.dto.InventoryCheckDTO;
import com.cabinet.entity.ItemLedger;
import com.cabinet.vo.InventoryCheckVO;
import com.cabinet.vo.LedgerVO;
import io.choerodon.mybatis.pagehelper.domain.PageRequest;

public interface ItemLedgerService {
    
    PageResult<LedgerVO> getLedgerList(String cabinetId, Integer status, 
                                       String category, PageRequest pageRequest);
    
    InventoryCheckVO checkInventory(InventoryCheckDTO dto);
    
    boolean saveLedger(ItemLedger ledger);
    
    boolean updateLedger(ItemLedger ledger);
}
```

ItemLedgerServiceImpl.java:
```java
package com.cabinet.service.impl;

import com.cabinet.common.PageResult;
import com.cabinet.dto.InventoryCheckDTO;
import com.cabinet.entity.ItemLedger;
import com.cabinet.mapper.ItemLedgerMapper;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.vo.InventoryCheckVO;
import com.cabinet.vo.LedgerVO;
import io.choerodon.mybatis.pagehelper.PageHelper;
import io.choerodon.mybatis.pagehelper.domain.PageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemLedgerServiceImpl implements ItemLedgerService {
    
    private final ItemLedgerMapper itemLedgerMapper;
    
    @Override
    public PageResult<LedgerVO> getLedgerList(String cabinetId, Integer status, 
                                                String category, PageRequest pageRequest) {
        return PageHelper.doPage(pageRequest, () -> 
            itemLedgerMapper.selectLedgerList(cabinetId, status, category)
        );
    }
    
    @Override
    public InventoryCheckVO checkInventory(InventoryCheckDTO dto) {
        // 查询台账总重量
        List<ItemLedger> ledgers = itemLedgerMapper.selectList(
            new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ItemLedger>()
                .eq(ItemLedger::getCabinetId, dto.getCabinetId())
                .eq(ItemLedger::getStatus, 0)
                .eq(ItemLedger::getDeleted, 0)
        );
        
        BigDecimal ledgerWeight = ledgers.stream()
            .map(ItemLedger::getTotalWeight)
            .filter(w -> w != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // TODO: 从称重模块获取实际重量
        BigDecimal actualWeight = dto.getActualWeight() != null ? 
            dto.getActualWeight() : BigDecimal.ZERO;
        
        BigDecimal difference = actualWeight.subtract(ledgerWeight);
        BigDecimal differenceRate = ledgerWeight.compareTo(BigDecimal.ZERO) > 0 ?
            difference.divide(ledgerWeight, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        
        InventoryCheckVO vo = new InventoryCheckVO();
        vo.setCabinetId(dto.getCabinetId());
        vo.setLedgerWeight(ledgerWeight);
        vo.setActualWeight(actualWeight);
        vo.setDifference(difference);
        vo.setDifferenceRate(differenceRate.toString() + "%");
        
        // 差异率超过5%标记异常
        if (differenceRate.abs().compareTo(new BigDecimal("5")) > 0) {
            vo.setStatus("abnormal");
        } else if (differenceRate.abs().compareTo(new BigDecimal("1")) > 0) {
            vo.setStatus("warning");
        } else {
            vo.setStatus("normal");
        }
        
        return vo;
    }
    
    @Override
    public boolean saveLedger(ItemLedger ledger) {
        return itemLedgerMapper.insert(ledger) > 0;
    }
    
    @Override
    public boolean updateLedger(ItemLedger ledger) {
        return itemLedgerMapper.updateById(ledger) > 0;
    }
}
```

---

#### Task 7: 创建 Controller 层
**Objective:** 实现 REST API 控制器

**Files:**
- Create: `backend/src/main/java/com/cabinet/controller/CabinetController.java`
- Create: `backend/src/main/java/com/cabinet/controller/ItemLedgerController.java`
- Create: `backend/src/main/java/com/cabinet/controller/WeightRecordController.java`
- Create: `backend/src/main/java/com/cabinet/controller/OperationLogController.java`

**Code:**

CabinetController.java:
```java
package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.dto.DoorOpenDTO;
import com.cabinet.entity.Cabinet;
import com.cabinet.service.CabinetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cabinet")
@RequiredArgsConstructor
public class CabinetController {
    
    private final CabinetService cabinetService;
    
    @GetMapping("/list")
    public Result<List<Cabinet>> list() {
        return Result.success(cabinetService.list());
    }
    
    @GetMapping("/detail")
    public Result<Cabinet> detail(@RequestParam String id) {
        return Result.success(cabinetService.getById(id));
    }
    
    @PostMapping("/save")
    public Result<Boolean> save(@RequestBody Cabinet cabinet) {
        return Result.success(cabinetService.saveOrUpdate(cabinet));
    }
    
    @PostMapping("/door/open")
    public Result<String> openDoor(@RequestBody DoorOpenDTO dto) {
        // TODO: 调用锁控服务开锁
        return Result.success("柜门已打开: " + dto.getCabinetId());
    }
}
```

ItemLedgerController.java:
```java
package com.cabinet.controller;

import com.cabinet.common.PageResult;
import com.cabinet.common.Result;
import com.cabinet.dto.InventoryCheckDTO;
import com.cabinet.entity.ItemLedger;
import com.cabinet.service.ItemLedgerService;
import com.cabinet.vo.InventoryCheckVO;
import com.cabinet.vo.LedgerVO;
import io.choerodon.mybatis.pagehelper.domain.PageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cabinet/ledger")
@RequiredArgsConstructor
public class ItemLedgerController {
    
    private final ItemLedgerService itemLedgerService;
    
    @GetMapping("/list")
    public Result<PageResult<LedgerVO>> list(
            @RequestParam String cabinetId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        PageRequest pageRequest = new PageRequest(page, size);
        return Result.success(itemLedgerService.getLedgerList(cabinetId, status, category, pageRequest));
    }
    
    @PostMapping("/save")
    public Result<Boolean> save(@RequestBody ItemLedger ledger) {
        return Result.success(itemLedgerService.saveLedger(ledger));
    }
    
    @PostMapping("/update")
    public Result<Boolean> update(@RequestBody ItemLedger ledger) {
        return Result.success(itemLedgerService.updateLedger(ledger));
    }
    
    @PostMapping("/inventory/check")
    public Result<InventoryCheckVO> checkInventory(@RequestBody InventoryCheckDTO dto) {
        return Result.success(itemLedgerService.checkInventory(dto));
    }
}
```

---

#### Task 8: 创建跨域配置和全局异常处理
**Objective:** 配置 CORS 和统一异常处理

**Files:**
- Create: `backend/src/main/java/com/cabinet/config/CorsConfig.java`
- Create: `backend/src/main/java/com/cabinet/config/GlobalExceptionHandler.java`

**Code:**

CorsConfig.java:
```java
package com.cabinet.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .maxAge(3600);
    }
}
```

GlobalExceptionHandler.java:
```java
package com.cabinet.config;

import com.cabinet.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public Result<String> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(e.getMessage());
    }
}
```

---

### Phase 2: 前端基础搭建

#### Task 9: 初始化 Vue3 项目
**Objective:** 创建 Vue3 + Vite + Element Plus 项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.js`
- Create: `frontend/src/App.vue`

**Code:**

package.json:
```json
{
  "name": "cabinet-ledger-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.8",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "element-plus": "^2.4.4",
    "axios": "^1.6.2",
    "@element-plus/icons-vue": "^2.1.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.0",
    "vite": "^5.0.0"
  }
}
```

vite.config.js:
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

main.js:
```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
```

App.vue:
```vue
<template>
  <router-view />
</template>
```

---

#### Task 10: 创建路由和布局
**Objective:** 配置前端路由和主布局

**Files:**
- Create: `frontend/src/router/index.js`
- Create: `frontend/src/views/Layout.vue`
- Create: `frontend/src/views/Dashboard.vue`

**Code:**

router/index.js:
```javascript
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import CabinetList from '../views/cabinet/CabinetList.vue'
import CabinetDetail from '../views/cabinet/CabinetDetail.vue'
import LedgerList from '../views/ledger/LedgerList.vue'
import InventoryCheck from '../views/ledger/InventoryCheck.vue'
import WeightData from '../views/weight/WeightData.vue'
import OperationLog from '../views/log/OperationLog.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', component: Dashboard },
      { path: 'cabinets', component: CabinetList },
      { path: 'cabinet/:id', component: CabinetDetail },
      { path: 'ledger', component: LedgerList },
      { path: 'inventory-check', component: InventoryCheck },
      { path: 'weight-data', component: WeightData },
      { path: 'operation-log', component: OperationLog }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

Layout.vue:
```vue
<template>
  <el-container class="layout">
    <el-aside width="200px">
      <el-menu
        :default-active="$route.path"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <div class="logo">智能柜台账</div>
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/cabinets">
          <el-icon><Box /></el-icon>
          <span>柜子管理</span>
        </el-menu-item>
        <el-menu-item index="/ledger">
          <el-icon><Document /></el-icon>
          <span>物品台账</span>
        </el-menu-item>
        <el-menu-item index="/inventory-check">
          <el-icon><Check /></el-icon>
          <span>库存盘点</span>
        </el-menu-item>
        <el-menu-item index="/weight-data">
          <el-icon><ScaleToWidth /></el-icon>
          <span>称重数据</span>
        </el-menu-item>
        <el-menu-item index="/operation-log">
          <el-icon><Timer /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>智能柜物品台账管理系统</span>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout { height: 100vh; }
.menu { height: 100%; border-right: none; }
.logo { 
  height: 60px; 
  line-height: 60px; 
  text-align: center; 
  color: #fff; 
  font-size: 16px; 
  font-weight: bold;
  background: #2b3649;
}
.header { 
  background: #fff; 
  box-shadow: 0 1px 4px rgba(0,21,41,.08); 
  display: flex; 
  align-items: center;
  font-weight: bold;
}
</style>
```

---

#### Task 11: 创建 API 封装和页面组件
**Objective:** 封装 Axios 请求，创建核心页面

**Files:**
- Create: `frontend/src/api/request.js`
- Create: `frontend/src/api/cabinet.js`
- Create: `frontend/src/api/ledger.js`
- Create: `frontend/src/views/cabinet/CabinetList.vue`
- Create: `frontend/src/views/ledger/LedgerList.vue`

**Code:**

request.js:
```javascript
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    const data = response.data
    if (data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(data)
    }
    return data
  },
  error => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
```

cabinet.js:
```javascript
import request from './request'

export const getCabinetList = () => request.get('/cabinet/list')
export const getCabinetDetail = (id) => request.get('/cabinet/detail?id=' + id)
export const saveCabinet = (data) => request.post('/cabinet/save', data)
export const openDoor = (data) => request.post('/cabinet/door/open', data)
```

ledger.js:
```javascript
import request from './request'

export const getLedgerList = (params) => request.get('/cabinet/ledger/list', { params })
export const saveLedger = (data) => request.post('/cabinet/ledger/save', data)
export const updateLedger = (data) => request.post('/cabinet/ledger/update', data)
export const checkInventory = (data) => request.post('/cabinet/ledger/inventory/check', data)
```

CabinetList.vue:
```vue
<template>
  <div>
    <h2>智能柜管理</h2>
    <el-table :data="cabinets" border>
      <el-table-column prop="id" label="柜号" width="100" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="location" label="位置" />
      <el-table-column prop="capacity" label="容量" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'danger'">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
          <el-button size="small" type="primary" @click="openCabinet(row)">开柜</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCabinetList, openDoor } from '../../api/cabinet'
import { ElMessage, ElMessageBox } from 'element-plus'

const cabinets = ref([])
const router = useRouter()

const loadData = async () => {
  const res = await getCabinetList()
  cabinets.value = res.data
}

const statusText = (status) => {
  const map = { 0: '停用', 1: '启用', 2: '维护中' }
  return map[status] || '未知'
}

const viewDetail = (row) => {
  router.push('/cabinet/' + row.id)
}

const openCabinet = async (row) => {
  try {
    await ElMessageBox.confirm('确认打开柜门 ' + row.name + '?', '提示')
    await openDoor({
      cabinetId: row.id,
      operator: 'admin',
      reason: '维护'
    })
    ElMessage.success('柜门已打开')
  } catch (e) {
    // 取消操作
  }
}

onMounted(loadData)
</script>
```

LedgerList.vue:
```vue
<template>
  <div>
    <h2>物品台账</h2>
    <el-form :inline="true" :model="queryForm">
      <el-form-item label="柜号">
        <el-select v-model="queryForm.cabinetId" placeholder="选择柜号">
          <el-option v-for="c in cabinets" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryForm.status" placeholder="全部" clearable>
          <el-option label="在库" :value="0" />
          <el-option label="已取出" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="类别">
        <el-input v-model="queryForm.category" placeholder="输入类别" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>
    
    <el-table :data="tableData" border>
      <el-table-column prop="itemName" label="物品名称" />
      <el-table-column prop="category" label="类别" width="100" />
      <el-table-column prop="spec" label="规格" width="120" />
      <el-table-column prop="slotNo" label="格口" width="80" />
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column prop="totalWeight" label="重量(kg)" width="100" />
      <el-table-column prop="storedBy" label="存放人" width="100" />
      <el-table-column prop="storedAt" label="存放时间" width="160" />
    </el-table>
    
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="search"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLedgerList } from '../../api/ledger'
import { getCabinetList } from '../../api/cabinet'

const cabinets = ref([])
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const queryForm = ref({
  cabinetId: '',
  status: null,
  category: ''
})

const loadCabinets = async () => {
  const res = await getCabinetList()
  cabinets.value = res.data
}

const search = async () => {
  const params = {
    ...queryForm.value,
    page: page.value - 1,
    size: pageSize.value
  }
  const res = await getLedgerList(params)
  tableData.value = res.data.list
  total.value = res.data.total
}

onMounted(() => {
  loadCabinets()
})
</script>
```

---

### Phase 3: 测试和验证

#### Task 12: 启动后端服务测试
**Objective:** 验证后端 API 正常工作

**Commands:**
```bash
cd /Users/csai/project/isd-robot/cabinet-ledger/backend
mvn spring-boot:run
```

**Verification:**
```bash
# 测试柜子列表接口
curl http://localhost:8080/api/cabinet/list

# 测试台账查询接口
curl "http://localhost:8080/api/cabinet/ledger/list?cabinetId=A01&page=0&size=20"
```

#### Task 13: 启动前端服务测试
**Objective:** 验证前端页面正常显示

**Commands:**
```bash
cd /Users/csai/project/isd-robot/cabinet-ledger/frontend
npm install
npm run dev
```

**Verification:**
- 访问 http://localhost:3000
- 确认左侧菜单正常显示
- 确认柜子列表页面数据加载正常
- 确认台账查询页面功能正常

---

## 完成标准

- [ ] 后端所有 API 正常工作
- [ ] 前端所有页面正常显示和交互
- [ ] 数据库表结构正确
- [ ] 分页功能正常（使用 PageHelper.doPage）
- [ ] 跨域配置生效
- [ ] 前后端能正常通信

---

*计划结束*
