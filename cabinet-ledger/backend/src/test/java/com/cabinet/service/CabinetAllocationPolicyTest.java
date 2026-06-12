package com.cabinet.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class CabinetAllocationPolicyTest {

    private final CabinetAllocationPolicy policy = new CabinetAllocationPolicy();

    @Test
    void prefersSingleSlotThatCanSatisfyQuantity() {
        List<CabinetAllocationPolicy.SlotAllocation> allocations = policy.allocate(List.of(
                new CabinetAllocationPolicy.AllocatableSlot(3L, "UABC-001", 1, 3, 5),
                new CabinetAllocationPolicy.AllocatableSlot(7L, "UABC-002", 2, 7, 10)
        ), 8);

        assertThat(allocations).hasSize(1);
        assertThat(allocations.get(0).slotId()).isEqualTo(7L);
        assertThat(allocations.get(0).quantity()).isEqualTo(8);
    }

    @Test
    void combinesSlotsOnlyWhenNoSingleSlotCanSatisfyQuantity() {
        List<CabinetAllocationPolicy.SlotAllocation> allocations = policy.allocate(List.of(
                new CabinetAllocationPolicy.AllocatableSlot(1L, "UABC-001", 1, 1, 5),
                new CabinetAllocationPolicy.AllocatableSlot(2L, "UABC-001", 1, 2, 4)
        ), 8);

        assertThat(allocations).hasSize(2);
        assertThat(allocations).extracting(CabinetAllocationPolicy.SlotAllocation::quantity)
                .containsExactly(5, 3);
    }
}
