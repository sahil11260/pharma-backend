package com.kavyapharm.farmatrack.target.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

public record CreateTargetRequest(
        @NotBlank(message = "MR name is required") String mrName,
        @NotBlank(message = "Period is required") String period,
        @NotNull(message = "Sales target is required") @PositiveOrZero(message = "Sales target must be >= 0") Integer salesTarget,
        @NotNull(message = "Visits target is required") @PositiveOrZero(message = "Visits target must be >= 0") Integer visitsTarget,
        LocalDate startDate,
        LocalDate endDate
) {
}
