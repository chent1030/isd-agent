package com.cabinet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("com.cabinet.mapper")
public class CabinetLedgerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CabinetLedgerApplication.class, args);
    }
}
