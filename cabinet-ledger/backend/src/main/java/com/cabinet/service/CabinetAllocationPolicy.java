package com.cabinet.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class CabinetAllocationPolicy {

    public List<SlotAllocation> allocate(List<AllocatableSlot> slots, int requestedQuantity) {
        if (requestedQuantity <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }
        List<AllocatableSlot> usableSlots = slots == null ? Collections.emptyList() : slots.stream()
                .filter(slot -> slot.quantity() > 0)
                .collect(Collectors.toList());

        AllocatableSlot singleSlot = usableSlots.stream()
                .filter(slot -> slot.quantity() >= requestedQuantity)
                .min(Comparator
                        .comparingInt((AllocatableSlot slot) -> slot.quantity() - requestedQuantity)
                        .thenComparing(slot -> slot.cabinetNo() == null ? Integer.MAX_VALUE : slot.cabinetNo())
                        .thenComparing(AllocatableSlot::slotNo))
                .orElse(null);
        if (singleSlot != null) {
            return Collections.singletonList(new SlotAllocation(singleSlot.slotId(), singleSlot.cabinetId(), singleSlot.cabinetNo(),
                    singleSlot.slotNo(), requestedQuantity));
        }

        List<AllocatableSlot> sortedSlots = usableSlots.stream()
                .sorted(Comparator
                        .comparingInt(AllocatableSlot::quantity)
                        .reversed()
                        .thenComparing(slot -> slot.cabinetNo() == null ? Integer.MAX_VALUE : slot.cabinetNo())
                        .thenComparing(AllocatableSlot::slotNo))
                .collect(Collectors.toList());

        List<SlotAllocation> allocations = new ArrayList<>();
        int remaining = requestedQuantity;
        for (AllocatableSlot slot : sortedSlots) {
            if (remaining <= 0) {
                break;
            }
            int allocated = Math.min(slot.quantity(), remaining);
            allocations.add(new SlotAllocation(slot.slotId(), slot.cabinetId(), slot.cabinetNo(), slot.slotNo(), allocated));
            remaining -= allocated;
        }
        if (remaining > 0) {
            throw new IllegalArgumentException("slot quantity is insufficient");
        }
        return allocations;
    }

    public static class AllocatableSlot {
        private final Long slotId;
        private final String cabinetId;
        private final Integer cabinetNo;
        private final Integer slotNo;
        private final int quantity;

        public AllocatableSlot(Long slotId, String cabinetId, Integer cabinetNo, Integer slotNo, int quantity) {
            this.slotId = slotId;
            this.cabinetId = cabinetId;
            this.cabinetNo = cabinetNo;
            this.slotNo = slotNo;
            this.quantity = quantity;
        }

        public Long slotId() {
            return slotId;
        }

        public String cabinetId() {
            return cabinetId;
        }

        public Integer cabinetNo() {
            return cabinetNo;
        }

        public Integer slotNo() {
            return slotNo;
        }

        public int quantity() {
            return quantity;
        }
    }

    public static class SlotAllocation {
        private final Long slotId;
        private final String cabinetId;
        private final Integer cabinetNo;
        private final Integer slotNo;
        private final int quantity;

        public SlotAllocation(Long slotId, String cabinetId, Integer cabinetNo, Integer slotNo, int quantity) {
            this.slotId = slotId;
            this.cabinetId = cabinetId;
            this.cabinetNo = cabinetNo;
            this.slotNo = slotNo;
            this.quantity = quantity;
        }

        public Long slotId() {
            return slotId;
        }

        public String cabinetId() {
            return cabinetId;
        }

        public Integer cabinetNo() {
            return cabinetNo;
        }

        public Integer slotNo() {
            return slotNo;
        }

        public int quantity() {
            return quantity;
        }
    }
}
