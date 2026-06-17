function firstDefined(...values: unknown[]) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

export function normalizeBorrowRecordLocation(record: any) {
  const rawCabinetNo = firstDefined(
    record?.cabinetNo,
    record?.cabinet_no,
    record?.cabinetCode,
    record?.cabinet_code,
    record?.lockerNo,
    record?.locker_no,
  )
  const rawSlotNo = firstDefined(
    record?.slotNo,
    record?.slot_no,
    record?.gridNo,
    record?.grid_no,
    record?.cellNo,
    record?.cell_no,
    record?.doorNo,
    record?.door_no,
    record?.lockNo,
    record?.lock_no,
  )
  const parsedSlotNo = Number(rawSlotNo)

  return {
    cabinetNo: String(rawCabinetNo ?? '').trim(),
    slotNo: Number.isFinite(parsedSlotNo) ? parsedSlotNo : undefined,
  }
}
