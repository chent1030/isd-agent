package com.cabinet.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class CabinetAllocationPolicy {

    public List<SlotAllocation> allocate(List<AllocatableSlot> slots, int requestedQuantity) {
        if (requestedQuantity <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }
        List<AllocatableSlot> usableSlots = slots == null ? List.of() : slots.stream()
                .filter(slot -> slot.quantity() > 0)
                .toList();

        AllocatableSlot singleSlot = usableSlots.stream()
                .filter(slot -> slot.quantity() >= requestedQuantity)
                .min(Comparator
                        .comparingInt((AllocatableSlot slot) -> slot.quantity() - requestedQuantity)
                        .thenComparing(slot -> slot.cabinetNo() == null ? Integer.MAX_VALUE : slot.cabinetNo())
                        .thenComparing(AllocatableSlot::slotNo))
                .orElse(null);
        if (singleSlot != null) {
            return List.of(new SlotAllocation(singleSlot.slotId(), singleSlot.cabinetId(), singleSlot.cabinetNo(),
                    singleSlot.slotNo(), requestedQuantity));
        }

        List<AllocatableSlot> sortedSlots = usableSlots.stream()
                .sorted(Comparator
                        .comparingInt(AllocatableSlot::quantity)
                        .reversed()
                        .thenComparing(slot -> slot.cabinetNo() == null ? Integer.MAX_VALUE : slot.cabinetNo())
                        .thenComparing(AllocatableSlot::slotNo))
                .toList();

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

    public record AllocatableSlot(Long slotId, String cabinetId, Integer cabinetNo, Integer slotNo, int quantity) {
    }

    public record SlotAllocation(Long slotId, String cabinetId, Integer cabinetNo, Integer slotNo, int quantity) {
    }
}
