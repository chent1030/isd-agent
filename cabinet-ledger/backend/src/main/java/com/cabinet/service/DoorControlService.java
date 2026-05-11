package com.cabinet.service;

import com.cabinet.dto.DoorOpenDTO;
import com.cabinet.vo.DoorOpenVO;

public interface DoorControlService {
    DoorOpenVO openDoor(DoorOpenDTO dto, String ipAddr);
}
