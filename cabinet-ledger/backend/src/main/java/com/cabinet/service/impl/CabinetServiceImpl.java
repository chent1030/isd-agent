package com.cabinet.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cabinet.entity.Cabinet;
import com.cabinet.mapper.CabinetMapper;
import com.cabinet.service.CabinetService;
import org.springframework.stereotype.Service;

@Service
public class CabinetServiceImpl extends ServiceImpl<CabinetMapper, Cabinet> implements CabinetService {
}
