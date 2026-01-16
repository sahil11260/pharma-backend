package com.kavyapharm.farmatrack.target.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

public record UpdateTargetRequest(
        @NotBlank(message = "MR name is required") String mrName,
        @NotBlank(message = "Period is required") String period,
        @NotNull(message = "Sales target is required") @PositiveOrZero(message = "Sales target must be >= 0") Integer salesTarget,
        @NotNull(message = "Sales achievement is required") @PositiveOrZero(message = "Sales achievement must be >= 0") Integer salesAchievement,
        @NotNull(message = "Visits target is required") @PositiveOrZero(message = "Visits target must be >= 0") Integer visitsTarget,
        @NotNull(message = "Visits achievement is required") @PositiveOrZero(message = "Visits achievement must be >= 0") Integer visitsAchievement,
        LocalDate startDate,
        LocalDate endDate,
        @NotBlank(message = "Status is required") String status
) {
}
