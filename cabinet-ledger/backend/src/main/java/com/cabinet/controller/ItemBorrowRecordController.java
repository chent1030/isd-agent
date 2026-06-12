package com.cabinet.controller;

import com.cabinet.common.Result;
import com.cabinet.dto.BorrowReminderMarkDTO;
import com.cabinet.dto.ItemBorrowDTO;
import com.cabinet.dto.ItemReturnDTO;
import com.cabinet.service.ItemBorrowRecordService;
import com.cabinet.service.OperationLogService;
import com.cabinet.vo.ItemBorrowRecordVO;
import io.choerodon.core.domain.Page;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cabinet/borrow")
public class ItemBorrowRecordController {
    private final ItemBorrowRecordService borrowRecordService;
    private final OperationLogService operationLogService;

    public ItemBorrowRecordController(ItemBorrowRecordService borrowRecordService,
                                      OperationLogService operationLogService) {
        this.borrowRecordService = borrowRecordService;
        this.operationLogService = operationLogService;
    }

    @GetMapping("/list")
    public Result<Page<ItemBorrowRecordVO>> list(@RequestParam(required = false) Integer status,
                                                 @RequestParam(required = false) Long itemId,
                                                 @RequestParam(required = false) String borrower,
                                                 @RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        return Result.success(borrowRecordService.getBorrowRecordList(status, itemId, borrower, page, size));
    }

    @GetMapping("/reminders/due")
    public Result<List<ItemBorrowRecordVO>> dueReminders(@RequestParam(defaultValue = "borrower") String reminderType) {
        return Result.success(borrowRecordService.getDueReminders(reminderType));
    }

    @PostMapping("/reminders/mark")
    public Result<Boolean> markReminder(@RequestBody BorrowReminderMarkDTO dto,
                                        @RequestHeader(value = "X-Operator", required = false) String operator,
                                        HttpServletRequest request) {
        boolean success = borrowRecordService.markReminder(dto == null ? null : dto.getBorrowRecordId(),
                dto == null ? null : dto.getReminderType());
        if (success) {
            operationLogService.record(null, operatorOrDefault(operator), "BORROW_REMINDER_MARK",
                    "标记借用提醒：" + dto.getReminderType() + "，记录：" + dto.getBorrowRecordId(), request.getRemoteAddr());
        }
        return Result.success(success);
    }

    @PostMapping("/borrow")
    public Result<ItemBorrowRecordVO> borrow(@RequestBody ItemBorrowDTO dto,
                                             @RequestHeader(value = "X-Operator", required = false) String operator,
                                             HttpServletRequest request) {
        ItemBorrowRecordVO vo = borrowRecordService.borrow(dto, operatorOrDefault(operator));
        operationLogService.record(vo == null ? null : vo.getCabinetId(), operatorOrDefault(operator), "ITEM_BORROW",
                "借用物品：" + (vo == null ? dto.getItemId() : vo.getItemName()), request.getRemoteAddr());
        return Result.success(vo);
    }

    @PostMapping("/return")
    public Result<ItemBorrowRecordVO> returnItem(@RequestBody ItemReturnDTO dto,
                                                 @RequestHeader(value = "X-Operator", required = false) String operator,
                                                 HttpServletRequest request) {
        ItemBorrowRecordVO vo = borrowRecordService.returnItem(dto, operatorOrDefault(operator));
        operationLogService.record(vo == null ? null : vo.getCabinetId(), operatorOrDefault(operator), "ITEM_RETURN",
                "归还物品：" + (vo == null ? dto.getBorrowRecordId() : vo.getItemName()), request.getRemoteAddr());
        return Result.success(vo);
    }

    private String operatorOrDefault(String operator) {
        return StringUtils.hasText(operator) ? operator : "admin";
    }
}
