package com.cabinet.config;

import io.choerodon.mybatis.pagehelper.Dialect;
import io.choerodon.mybatis.pagehelper.PageInterceptor;
import io.choerodon.mybatis.pagehelper.cache.SimpleCache;
import io.choerodon.mybatis.pagehelper.dialect.MySqlDialect;
import io.choerodon.mybatis.pagehelper.page.PageCountCacherMemory;
import io.choerodon.mybatis.pagehelper.parser.ICountSqlParser;
import io.choerodon.mybatis.MybatisConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.lang.reflect.Field;
import java.util.Properties;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.cache.CacheKey;

@Configuration
public class MybatisConfig {

    @Bean
    public ICountSqlParser countSqlParser() {
        return sql -> "SELECT COUNT(1) FROM (" + sql + ") page_count";
    }

    @Bean
    public Dialect mySqlDialect(ICountSqlParser countSqlParser) {
        return new MySqlDialect(countSqlParser);
    }

    @Bean
    public PageInterceptor pageInterceptor(Dialect mySqlDialect) throws NoSuchFieldException {
        Field additionalParametersField = BoundSql.class.getDeclaredField("additionalParameters");
        additionalParametersField.setAccessible(true);
        MybatisConfigurationProperties.PageCount pageCount = new MybatisConfigurationProperties.PageCount();
        pageCount.setCacheOpen(false);
        pageCount.setAlwaysCache(false);
        return new PageInterceptor(mySqlDialect,
                additionalParametersField,
                new SimpleCache<CacheKey, MappedStatement>(new Properties(), "page-count-ms"),
                new PageCountCacherMemory(pageCount));
    }
}
